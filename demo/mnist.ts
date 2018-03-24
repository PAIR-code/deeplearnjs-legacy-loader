/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as dl from 'deeplearn';

// In your project, the next line should be:
// import {CheckpointLoader} from 'deeplearn-legacy-loader';
import {CheckpointLoader} from '../src/index';

// manifest.json lives in the same directory as the mnist demo.
const reader = new CheckpointLoader('.');
reader.getAllVariables().then(vars => {
  // Get sample data.
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'sample_data.json');
  xhr.onload = async () => {
    const data = JSON.parse(xhr.responseText);

    console.log(`Evaluation set: n=${data.images.length}.`);

    let numCorrect = 0;
    for (let i = 0; i < data.images.length; i++) {
      const inferred = dl.tidy(() => {
        const x = dl.tensor1d(data.images[i]);
        return infer(x, vars);
        // Infer through the model to get a prediction.
      });
      const predictedLabel = Math.round((await inferred.data())[0]);
      inferred.dispose();
      console.log(`Item ${i}, predicted label ${predictedLabel}.`);

      // Aggregate correctness to show accuracy.
      const label = data.labels[i];
      if (label === predictedLabel) {
        numCorrect++;
      }

      // Show the image.
      dl.tidy(() => {
        const result =
            renderResults(dl.tensor1d(data.images[i]), label, predictedLabel);
        document.body.appendChild(result);
      });
    }

    // Compute final accuracy.
    const accuracy = numCorrect * 100 / data.images.length;
    document.getElementById('accuracy').innerHTML = `${accuracy}%`;
  };
  xhr.onerror = (err) => console.error(err);
  xhr.send();
});

/**
 * Infers through a 3-layer fully connected MNIST model using the Math API.
 * This is the lowest level user-facing API in deeplearn.js giving the most
 * control to the user. Math commands execute immediately, like numpy.
 */
export function infer(
    x: dl.Tensor1D, vars: {[varName: string]: dl.Tensor}): dl.Scalar {
  const hidden1W = vars['hidden1/weights'] as dl.Tensor2D;
  const hidden1B = vars['hidden1/biases'] as dl.Tensor1D;
  const hidden2W = vars['hidden2/weights'] as dl.Tensor2D;
  const hidden2B = vars['hidden2/biases'] as dl.Tensor1D;
  const softmaxW = vars['softmax_linear/weights'] as dl.Tensor2D;
  const softmaxB = vars['softmax_linear/biases'] as dl.Tensor1D;

  const hidden1 =
      x.as2D(-1, hidden1W.shape[0]).matMul(hidden1W).add(hidden1B).relu() as
      dl.Tensor1D;
  const hidden2 = hidden1.as2D(-1, hidden2W.shape[0])
                      .matMul(hidden2W)
                      .add(hidden2B)
                      .relu() as dl.Tensor1D;
  const logits =
      hidden2.as2D(-1, softmaxW.shape[0]).matMul(softmaxW).add(softmaxB);

  return logits.argMax();
}

function renderMnistImage(array: dl.Tensor1D) {
  const width = 28;
  const height = 28;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const float32Array = array.dataSync();
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < float32Array.length; ++i) {
    const j = i * 4;
    const value = Math.round(float32Array[i] * 255);
    imageData.data[j + 0] = value;
    imageData.data[j + 1] = value;
    imageData.data[j + 2] = value;
    imageData.data[j + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function renderResults(
    array: dl.Tensor1D, label: number, predictedLabel: number) {
  const root = document.createElement('div');
  root.appendChild(renderMnistImage(array));
  const actual = document.createElement('div');
  actual.innerHTML = `Actual: ${label}`;
  root.appendChild(actual);
  const predicted = document.createElement('div');
  predicted.innerHTML = `Predicted: ${predictedLabel}`;
  root.appendChild(predicted);

  if (label !== predictedLabel) {
    root.classList.add('error');
  }

  root.classList.add('result');
  return root;
}
