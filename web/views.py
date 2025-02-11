from django.shortcuts import render

def login(request):
  return render(request, 'web/login.html')

def register(request):
  return render(request, 'web/register.html')

def recover(request):
  return render(request, 'web/recover.html')

def profile(request):
  return render(request, 'web/profile.html')

def config(request):
  return render(request, 'web/config.html')

def manage_period(request):
  return render(request, 'web/manage-period.html')

def manage_subject(request):
  return render(request, 'web/manage-subject.html')

def manage_period_subject(request):
  return render(request, 'web/manage-period-subject.html')

def simulator(request):
  return render(request, 'web/simulator.html')

def index(request):
  return render(request, 'web/index.html')

def subjects(request):
  return render(request, 'web/subjects.html')

def subjects_upload(request):
  return render(request, 'web/subjects-upload.html')

def evaluations(request):
  return render(request, 'web/evaluations.html')

def evaluation(request):
  return render(request, 'web/evaluation.html')

def questions(request):
  return render(request, 'web/questions.html')

def evaluation_details(request):
  return render(request, 'web/evaluation-details.html')

def progress(request):
  return render(request, 'web/progress.html')