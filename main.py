from transformers import T5ForConditionalGeneration, T5Tokenizer

model_name = "t5-base"  # or "t5-large" for better results
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name)

text = "Generate a multiple-choice question from the following passage: The mitochondria is the powerhouse of the cell."
input_ids = tokenizer.encode(text, return_tensors="pt")

output_ids = model.generate(input_ids, max_length=100, num_return_sequences=1)
mcq = tokenizer.decode(output_ids[0], skip_special_tokens=True)
print(mcq)
