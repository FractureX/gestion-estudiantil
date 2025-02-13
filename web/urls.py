# web/urls.py
from django.urls import path
from . import views

urlpatterns = [
  path('login/', views.login, name='login'), # Login
  path('register/', views.register, name='register'), # Registro
  path('recover/', views.recover, name='recover'), # Registro
  path('profile/', views.profile, name='profile'), # Perfil
  path('settings/', views.settings, name='settings'), # Configuración
  path('reports/', views.reports, name='reports'), # Reportes
  path('manage-period/', views.manage_period, name='manage_period'), # Gestión de periodo
  path('manage-subject/', views.manage_subject, name='manage_subject'), # Gestión de materia
  path('manage-period-subject/', views.manage_period_subject, name='manage_period_subject'), # Gestión de materias por periodo
  path('simulator/', views.simulator, name='simnulator'), # Simulador
  path('', views.index, name='index'), # Dashboard
  path('subjects/', views.subjects, name='subjects'), # Materias
  path('subjects-upload/', views.subjects_upload, name='subjects_upload'), # Subir PDF de Materias
  path('evaluations/', views.evaluations, name='evaluations'), # Evaluaciones
  path('evaluation/', views.evaluation, name='evaluation'), # Evaluación
  path('questions/', views.questions, name='questions'), # Preguntas fallidas
  path('evaluation-details/', views.evaluation_details, name='evaluation_details'), # Detalles de evaluación
  path('progress/', views.progress, name='progress'), # Progreso
]
