from django.urls import path

from .views import *

urlpatterns = [
    path('', index, name='index'),
    path('predict/<str:dataset>/<int:isPreTrained>/<int:hiddenLayersCount>/<int:hiddenLayersHeight>/<str:sentence>', neuralNetwork, name='neuralNetwork'),
]
