import mimetypes
from django.core.exceptions import ValidationError

def validate_pdf(value):
  # Verificar si la extensión es .pdf
  if not value.name.endswith('.pdf'):
    raise ValidationError("El archivo debe ser un PDF.")
  
  # Verificar si el tipo MIME es application/pdf
  file_mime_type, _ = mimetypes.guess_type(value.name)
  if file_mime_type != 'application/pdf':
    raise ValidationError("El archivo debe ser un PDF válido.")
  