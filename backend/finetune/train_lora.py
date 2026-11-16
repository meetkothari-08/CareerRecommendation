"""QLoRA fine-tuning of an open LLM into a grounded career advisor.

Requires a CUDA GPU (a single 16-24 GB card is enough for 1-3B models) and the
packages in ``finetune/requirements.txt``.

    pip install -r finetune/requirements.txt
    python -m finetune.build_sft_dataset --n 1500
    python -m finetune.train_lora --base-model meta-llama/Llama-3.2-3B-Instruct --epochs 2

Serve the result behind an OpenAI-compatible endpoint and point the API at it:

    vllm serve meta-llama/Llama-3.2-3B-Instruct --enable-lora \
        --lora-modules careerrec-advisor=models/careerrec-advisor-lora --port 8001
    export LLM_BASE_URL=http://localhost:8001/v1 LLM_MODEL=careerrec-advisor LLM_API_KEY=local
"""

from __future__ import annotations

import argparse

from careerrec import paths


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-model", default="meta-llama/Llama-3.2-3B-Instruct")
    parser.add_argument("--dataset", default=str(paths.SFT_DATASET_PATH))
    parser.add_argument("--output", default=str(paths.MODELS_DIR / "careerrec-advisor-lora"))
    parser.add_argument("--epochs", type=float, default=2)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--lora-r", type=int, default=16)
    parser.add_argument("--batch-size", type=int, default=4)
    parser.add_argument("--max-seq-len", type=int, default=1536)
    args = parser.parse_args()

    # Heavy imports are deferred so the rest of the project does not depend on them.
    import torch
    from datasets import load_dataset
    from peft import LoraConfig
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from trl import SFTConfig, SFTTrainer

    dataset = load_dataset("json", data_files=args.dataset, split="train").train_test_split(test_size=0.05, seed=42)
    tokenizer = AutoTokenizer.from_pretrained(args.base_model)
    tokenizer.pad_token = tokenizer.pad_token or tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        args.base_model,
        quantization_config=BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                                               bnb_4bit_compute_dtype=torch.bfloat16, bnb_4bit_use_double_quant=True),
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )
    lora = LoraConfig(r=args.lora_r, lora_alpha=2 * args.lora_r, lora_dropout=0.05, task_type="CAUSAL_LM",
                      target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"])
    config = SFTConfig(
        output_dir=args.output,
        num_train_epochs=args.epochs,
        per_device_train_batch_size=args.batch_size,
        gradient_accumulation_steps=4,
        learning_rate=args.lr,
        lr_scheduler_type="cosine",
        warmup_ratio=0.03,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="epoch",
        bf16=True,
        max_length=args.max_seq_len,
        assistant_only_loss=True,  # learn only the advisor's answers, not the prompts
        report_to="none",
    )
    trainer = SFTTrainer(model=model, args=config, train_dataset=dataset["train"], eval_dataset=dataset["test"],
                         processing_class=tokenizer, peft_config=lora)
    trainer.train()
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)
    print(f"saved LoRA adapter -> {args.output}")


if __name__ == "__main__":
    main()
