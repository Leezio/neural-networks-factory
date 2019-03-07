from django.http import HttpResponse
from django.http import JsonResponse
from django.template import loader

import tensorflow as tf
from tensorflow import keras
import numpy as np
import matplotlib.pyplot as plt
from IPython.display import set_matplotlib_formats
set_matplotlib_formats('svg')

def index(request):
    template = loader.get_template('index.html')
    return HttpResponse(template.render({}, request))

def neuralNetwork(request):
    imdb = keras.datasets.imdb
    (train_data, train_labels), (test_data, test_labels) = imdb.load_data(num_words=10000)

    train_data = keras.preprocessing.sequence.pad_sequences(train_data, value=0, padding='post', maxlen=256)

    test_data = keras.preprocessing.sequence.pad_sequences(test_data, value=0, padding='post', maxlen=256)

    print(test_data)

    vocab_size = 10000

    model = keras.Sequential()
    model.add(keras.layers.Embedding(vocab_size, 16))
    model.add(keras.layers.GlobalAveragePooling1D())
    model.add(keras.layers.Dense(16, activation=tf.nn.relu))
    model.add(keras.layers.Dense(1, activation=tf.nn.sigmoid))

    model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
              
    x_val = train_data[:10000]
    partial_x_train = train_data[10000:]

    y_val = train_labels[:10000]
    partial_y_train = train_labels[10000:]   

    model.fit(partial_x_train, partial_y_train, epochs=10, batch_size=512, validation_data=(x_val, y_val), verbose=0)

    score, accuracy = model.evaluate(test_data, test_labels, batch_size=512, verbose=0)                    

    return JsonResponse({'TensorFlow': tf.__version__, "Result": {"Score": score, "Accuracy": accuracy}})

