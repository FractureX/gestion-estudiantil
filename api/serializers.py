from rest_framework import serializers
from .models import (
  Rol, 
  Usuario, 
  Periodo, 
  Materia,
  MateriaPeriodo,
  DocumentoPDF,
  Evaluacion,
  Pregunta,
  Recomendacion,
  Historial, 
  Notificacion
)

class RolSerializer(serializers.ModelSerializer):
  class Meta:
    model = Rol
    fields = '__all__'

class PeriodoSerializer(serializers.ModelSerializer):
  class Meta:
    model = Periodo
    fields = '__all__'

class MateriaSerializer(serializers.ModelSerializer):
  class Meta:
    model = Materia
    fields = '__all__'

class MateriaPeriodoSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  materia = serializers.PrimaryKeyRelatedField(queryset=Materia.objects.all())
  periodo = serializers.PrimaryKeyRelatedField(queryset=Periodo.objects.all())

  class Meta:
    model = MateriaPeriodo
    fields = '__all__'

  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['materia'] = MateriaSerializer(instance.materia).data
    representation['periodo'] = PeriodoSerializer(instance.periodo).data

    return representation

class UsuarioSerializer(serializers.ModelSerializer):
  rol = serializers.PrimaryKeyRelatedField(queryset=Rol.objects.all())
  periodo = serializers.PrimaryKeyRelatedField(queryset=Periodo.objects.all())
  
  class Meta:
    model = Usuario
    fields = '__all__'
    extra_kwargs = {
      'password': {'write_only': True},
      'salt': {'write_only': True}
    }
  
  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['rol'] = RolSerializer(instance.rol).data
    representation['periodo'] = PeriodoSerializer(instance.periodo).data

    return representation

class DocumentoPDFSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
  materia_periodo = serializers.PrimaryKeyRelatedField(queryset=MateriaPeriodo.objects.all())

  class Meta:
    model = DocumentoPDF
    fields = '__all__'

  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Asegúrate de que `instance` es un objeto y no un diccionario
    if isinstance(instance, DocumentoPDF):
      representation['usuario'] = UsuarioSerializer(instance.usuario).data
      representation['materia_periodo'] = MateriaPeriodoSerializer(instance.materia_periodo).data
    else:
      # Si no es una instancia de DocumentoPDF, puede que sea un diccionario
      # No hagas la serialización de los campos relacionados
      representation['usuario'] = instance.get('usuario', None)
      representation['materia_periodo'] = instance.get('materia_periodo', None)

    return representation

class EvaluacionSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  documento_pdf = serializers.PrimaryKeyRelatedField(queryset=DocumentoPDF.objects.all())
  
  class Meta:
    model = Evaluacion
    fields = '__all__'
  
  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['documento_pdf'] = DocumentoPDFSerializer(instance.documento_pdf).data

    return representation

class PreguntaSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  evaluacion = serializers.PrimaryKeyRelatedField(queryset=Evaluacion.objects.all())
  
  class Meta:
    model = Pregunta
    fields = '__all__'
  
  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['evaluacion'] = EvaluacionSerializer(instance.evaluacion).data

    return representation

class RecomendacionSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  materia_periodo = serializers.PrimaryKeyRelatedField(queryset=MateriaPeriodo.objects.all())
  usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
  
  class Meta:
    model = Recomendacion
    fields = '__all__'
  
  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['materia_periodo'] = MateriaPeriodoSerializer(instance.materia_periodo).data
    representation['usuario'] = UsuarioSerializer(instance.usuario).data

    return representation

class HistorialSerializer(serializers.ModelSerializer):
  # Mantén los campos como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
  
  class Meta:
    model = Historial
    fields = '__all__'
  
  def to_representation(self, instance):
    # Llama al método de representación predeterminado de la clase padre
    representation = super().to_representation(instance)

    # Anida los serializadores completos para devolver datos completos en los GET
    representation['usuario'] = UsuarioSerializer(instance.usuario).data

    return representation

class NotificacionSerializer(serializers.ModelSerializer):
  # Mantén el campo usuario como PrimaryKeyRelatedField para recibir solo IDs en POST y PUT
  usuario = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())

  class Meta:
    model = Notificacion
    fields = '__all__'

  def to_representation(self, instance):
    representation = super().to_representation(instance)
    # Anida el serializador completo para devolver datos completos en los GET
    representation['usuario'] = UsuarioSerializer(instance.usuario).data
    return representation