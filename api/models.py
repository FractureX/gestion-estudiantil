from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from .validators import validate_pdf
from django.utils.timezone import now
import datetime

class Rol(models.Model):
  nombre = models.CharField(max_length=100, unique=True)
  
class Periodo(models.Model):
  nombre = models.CharField(max_length=100, unique=True)

class Materia(models.Model):
  nombre = models.CharField(max_length=100, unique=True)

class MateriaPeriodo(models.Model):
  materia = models.ForeignKey(to=Materia, on_delete=models.CASCADE, related_name="materias_periodo", null=False)
  periodo = models.ForeignKey(to=Periodo, on_delete=models.CASCADE, related_name="materias_periodo", null=False)
  class Meta:
    constraints = [
      models.UniqueConstraint(fields=['materia', 'periodo'], name='unique_materia_periodo')
    ]

class UsuarioManager(BaseUserManager):
  def create_user(self, email, password=None, **extra_fields):
    if not email:
      raise ValueError("El usuario debe tener un correo")
    user = self.model(email=email, **extra_fields)
    user.set_password(password)
    user.save(using=self._db)
    return user

  def create_superuser(self, email, password=None, **extra_fields):
    # Asignar el rol deseado para el superusuario
    rol_admin, _ = Rol.objects.get_or_create(nombre='Administrador')  # Ajusta el nombre según tu modelo
    extra_fields.setdefault('is_superuser', True)
    extra_fields.setdefault('is_staff', True)
    extra_fields.setdefault('is_active', True)
    extra_fields.setdefault('rol', rol_admin)

    return self.create_user(email, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
  rol = models.ForeignKey(to=Rol, on_delete=models.CASCADE, related_name="usuarios", null=False)
  periodo = models.ForeignKey(to=Periodo, on_delete=models.CASCADE, related_name="usuarios", null=True)
  nombres = models.CharField(max_length=50, null=False)
  apellidos = models.CharField(max_length=50, null=False)
  cedula = models.CharField(max_length=20, unique=True, null=False)
  email = models.EmailField(unique=True, null=False)
  password = models.CharField(max_length=128, null=False)
  is_superuser = models.BooleanField(default=False)
  is_staff = models.BooleanField(default=False)
  is_active = models.BooleanField(default=True)

  objects = UsuarioManager()

  USERNAME_FIELD = 'email'
  REQUIRED_FIELDS = ['nombres', 'apellidos', 'cedula']

class DocumentoPDF(models.Model):
  usuario = models.ForeignKey(to=Usuario, on_delete=models.CASCADE, related_name="documentos_pdf", null=False)
  materia_periodo = models.ForeignKey(to=MateriaPeriodo, on_delete=models.CASCADE, related_name="documentos_pdf", null=False)
  archivo = models.FileField(null=False, validators=[validate_pdf], upload_to="api/documentos_pdf/")
  fecha = models.DateTimeField(null=False, default=datetime.datetime.now())

class Evaluacion(models.Model):
  documento_pdf = models.OneToOneField(to=DocumentoPDF, on_delete=models.CASCADE, related_name="evaluaciones", null=False)
  titulo = models.TextField(null=False)
  fecha_evaluacion = models.DateTimeField(null=False, default=timezone.now)
  duracion = models.TimeField(null=False)

class Pregunta(models.Model):
  evaluacion = models.ForeignKey(to=Evaluacion, on_delete=models.CASCADE, related_name="preguntas", null=False)
  pregunta = models.TextField(null=False)
  respuesta_correcta = models.TextField(null=False, default="")
  respuesta = models.TextField(null=False, default="")
  puntaje = models.FloatField(null=False, default=0.00)
  
  class Meta:
    constraints = [
      models.UniqueConstraint(fields=['evaluacion', 'pregunta'], name='unique_evaluacion_pregunta')
    ]

class Recomendacion(models.Model):
  materia_periodo = models.ForeignKey(to=MateriaPeriodo, on_delete=models.CASCADE, related_name="recomendaciones", null=False)
  usuario = models.ForeignKey(to=Usuario, on_delete=models.CASCADE, related_name="recomendaciones", null=False)
  evaluacion = models.ForeignKey(to=Evaluacion, on_delete=models.CASCADE, related_name="recomendaciones", null=False)
  pregunta = models.ForeignKey(to=Pregunta, on_delete=models.CASCADE, related_name="recomendaciones", null=False)
  descripcion = models.TextField(null=False)

class Historial(models.Model):
  usuario = models.ForeignKey(to=Usuario, on_delete=models.CASCADE, related_name="historial", null=False)
  descripcion = models.CharField(max_length=255, null=False)
  fecha = models.DateTimeField(default=timezone.now, null=False)

class OTPCode(models.Model):
  email = models.EmailField()
  code = models.CharField(max_length=6)
  created_at = models.DateTimeField(auto_now_add=True)

  def is_valid(self):
    return self.created_at >= now() - datetime.timedelta(minutes=5)  # Expira en 5 min

class Notificacion(models.Model):
  usuario = models.ForeignKey(to=Usuario, on_delete=models.CASCADE, related_name="notificaciones", null=False)
  evaluacion = models.ForeignKey(to=Evaluacion, on_delete=models.CASCADE, related_name="notificaciones")
  titulo = models.CharField(max_length=255, null=False)
  descripcion = models.TextField(null=False)
  fecha_creacion = models.DateTimeField(default=timezone.now, null=False)
  fecha_aparicion = models.DateTimeField(default=timezone.now, null=False)
  url = models.URLField(null=False)
  visto = models.BooleanField(default=False, null=False)

  class Meta:
    ordering = ['-fecha_creacion'] # Ordenar las notificaciones por fecha de creación descendente (la más reciente primero)