from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "deepseek-ai/DeepSeek-R1-Distill-Llama-70B"

tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

text = "Generate a multiple-choice question from the following passage: The mitochondria is the powerhouse of the cell."
input_ids = tokenizer(text, return_tensors="pt").input_ids

output_ids = model.generate(input_ids, max_length=100, num_return_sequences=1)
mcq = tokenizer.decode(output_ids[0], skip_special_tokens=True)
print(mcq)
