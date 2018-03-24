#!/usr/bin/env bash
# Copyright 2018 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================

# Exit immediately if a command exits with a non-zero status.
set -e

rimraf dist/
yarn
tsc --sourceMap false
browserify -g browserify-shim --standalone deeplearn_legacy_loader src/index.ts -p [tsify] > dist/deeplearn-legacy-loader.js
uglifyjs dist/deeplearn-legacy-loader.js -c -m -o dist/deeplearn-legacy-loader.min.js
echo "Stored standalone library at dist/deeplearn-legacy-loader(.min).js"
npm pack
