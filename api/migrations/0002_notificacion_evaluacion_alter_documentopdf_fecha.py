# Generated by Django 5.1.3 on 2025-02-12 06:26

import datetime
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificacion',
            name='evaluacion',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='notificaciones', to='api.evaluacion'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='documentopdf',
            name='fecha',
            field=models.DateTimeField(default=datetime.datetime(2025, 2, 12, 1, 25, 34, 984674)),
        ),
    ]
