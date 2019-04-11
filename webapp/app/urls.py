from django.urls import path

from .views import *

urlpatterns = [
    path('', index, name='index'),
    path('predict/<str:sentence>', neuralNetwork, name='neuralNetwork'),
]
