from django.http import HttpResponse
from django.http import JsonResponse
from django.template import loader

import tensorflow as tf
from tensorflow import keras


def index(request):
    template = loader.get_template('index.html')
    return HttpResponse(template.render({}, request))


def neuralNetwork(request, sentence):
    imdb = keras.datasets.imdb

    sentence = "I hate this movie"

    word_index = imdb.get_word_index()

    test=[]

    for word in keras.preprocessing.text.text_to_word_sequence(sentence, filters='!"#$%&()*+,-./:;<=>?@[\\]^_`{|}~\t\n', lower=True, split=' '):
        if word in word_index:
            test.append(word_index[word])

    test = keras.preprocessing.sequence.pad_sequences([test], maxlen=256)

    model = keras.models.load_model('my_model.h5')

    model.summary()
    
    prediction = model.predict_classes(test, verbose=1)

    if (prediction[0][0] == 1):
        prediction = "Positive"
    else:
        prediction = "Negative"

    return JsonResponse({'TensorFlow': str(tf.__version__),"Sentence": sentence, "Result": {"Prediction": prediction}})
