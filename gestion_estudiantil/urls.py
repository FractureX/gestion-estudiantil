# urls.py
from django.conf import settings
from django.urls import path, include
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from api.views import (
  RolViewSet, 
  NotificacionViewSet, 
  PeriodoViewSet,
  MateriaViewSet,
  MateriaPeriodoViewSet,
  UsuarioViewSet,
  DocumentoPDFViewSet,
  EvaluacionViewSet,
  PreguntaViewSet,
  RecomendacionViewSet,
  HistorialViewSet,
  ValidateTokenAPIView,
  GetUserInfo,
  SendOtpCode,
  VerifyOtpCode,
  DownloadReportPDF
)

router = DefaultRouter()
router.register(r'rol', RolViewSet)
router.register(r'notificacion', NotificacionViewSet)
router.register(r'periodo', PeriodoViewSet)
router.register(r'materia', MateriaViewSet)
router.register(r'materia-periodo', MateriaPeriodoViewSet)
router.register(r'usuario', UsuarioViewSet)
router.register(r'documento-pdf', DocumentoPDFViewSet)
router.register(r'evaluacion', EvaluacionViewSet)
router.register(r'pregunta', PreguntaViewSet)
router.register(r'recomendacion', RecomendacionViewSet)
router.register(r'historial', HistorialViewSet)

urlpatterns = [
  path('', include('web.urls')), # Incluye las rutas de la aplicación web
  path('api/', include(router.urls)), # Incluye las rutas de la API bajo el prefijo /api/
  path('api/user/info/', GetUserInfo, name="get_user_info"), # Incluye un endpoint para traer la info del usuario
  path("api/validate_token/", ValidateTokenAPIView.as_view()), # Incluye el endpoint para validar el token
  path('api/user/otp/', SendOtpCode, name="send_otp_code"), # Envía el código OTP al correo
  path('api/user/otp/verify/', VerifyOtpCode, name="verify_otp_code"), # Verificar el código OTP
  path('api/report/pdf/', DownloadReportPDF, name="download_report_pdf"), # Descargar reporte pdf
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
