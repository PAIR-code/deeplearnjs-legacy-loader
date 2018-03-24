# deeplearn.js legacy loader

This repo provides the legacy loader for porting a TensorFlow model to deeplearn.js. Note that this loader is deprecated.

## Usage
```js
import {CheckpointLoader} from 'deeplearn-legacy-loader';
const reader = new CheckpointLoader(pathToCheckpointDir);
reader.getAllVariables().then(vars => {
  // vars maps a variable name to a Tensor.
});
```

## Tutorial (Porting MNIST)
All the necessary resources used in this tutorial are stored in the [demo/](./demo) directory.

To demonstrate the porting steps, we will use a fully connected neural network that predicts hand-written digits
from the MNIST dataset. The code is forked from the official
[TensorFlow MNIST tutorial](https://github.com/tensorflow/tensorflow/blob/r1.2/tensorflow/examples/tutorials/mnist/fully_connected_feed.py).

Before we start, make sure you have TensorFlow installed.

First, we clone this repository. We cd into the base dir and train the model in TensorFlow by running:

```bash
python demo/fully_connected_feed.py
```

The training should take ~1 minute and will store a model checkpoint in
`/tmp/tensorflow/mnist/tensorflow/mnist/logs/fully_connected_feed/`.

Next, we need to port the weights from the TensorFlow checkpoint to a format
the loader undestands. We provide a script that does this.
We run it from the base directory:

```bash
python python/dump_checkpoint_vars.py \
  --model_type=tensorflow \
  --output_dir=demo/ \
  --checkpoint_file=/tmp/tensorflow/mnist/logs/fully_connected_feed/model.ckpt-1999
```

The script will save a set of files (one file per variable, and a
`manifest.json`) in the [demo/](./demo/) directory. The `manifest.json` is a simple
dictionary that maps variable names to files and their shapes:

```json
{
  ...,
  "hidden1/weights": {
    "filename": "hidden1_weights",
    "shape": [784, 128]
  },
  ...
}
```

To read the weights, we need to create a `CheckpointLoader` and point it to the
manifest file. We then call `loader.getAllVariables()` which returns a
dictionary that maps variable names to `Tensor`s. At that point, we are ready
to write our model. Here is a snippet demonstrating the use of
`CheckpointLoader`:

```js
import * as dl from 'deelearn';
import {CheckpointLoader} from 'deeplearn-legacy-loader';

// manifest.json is in the same dir as index.html.
const varLoader = new CheckpointLoader('.');

varLoader.getAllVariables().then(vars => {
  // Get Tensor of variables casted with expected dimension.
  const hidden1W = vars['hidden1/weights'];
  const hidden1B = vars['hidden1/biases'];

  // Write your model here...
});
```

For details regarding the full model code, see [demo/mnist.ts](./demo/mnist.ts).

To run the mnist demo, run `yarn run-demo` from the base dir. This compiles the typescript code and runs an http-server on port 8080 that serves the static html/js files.

```bash
yarn
yarn run-demo

>> Starting up http-server, serving demo/
>> Available on:
>>   http://127.0.0.1:8080
>>   http://192.168.1.136:8080
>> Hit CTRL-C to stop the server
```

You should see a simple page showing test accuracy of ~90% measured using a test set of 50 mnist images stored in [demo/sample_data.json](./demo/sample_data.json).
