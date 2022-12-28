// export the node module
module.exports = function (RED) {
  // import helper module
  const tfmodel = require("./tfjs-tutorial-util.js");

  // load the model
  async function loadModel(config, node) {
    node.model = await tfmodel.loadModel(config.modelUrl, config.fromHub);
  }

  // define the node's behavior
  function TfjsTutorialNode(config) {
    // initialize the features
    RED.nodes.createNode(this, config);
    const node = this;

    loadModel(config, node);

    // register a listener to get called whenever a message arrives at the node
    node.on("input", function (msg) {
      // preprocess the incoming image
      const [imageBuffer, inputTensor] = tfmodel.processInput(msg.payload);
      // get image/input shape
      const height = inputTensor.shape[1];
      const width = inputTensor.shape[2];

      console.log({ width, height });

      // get the prediction
      if (inputTensor && node.model) {
        node.model.executeAsync(inputTensor).then((prediction) => {
          const predicts = tfmodel.processOutput(prediction, height, width);
          /* msg.payload = false; */
          /* if (predicts[0].label === "person") { */
          /*   msg.payload = true; */
          /* } */
          msg.payload = imageBuffer;
          msg.annotations = predicts;
          msg.isPerson = predicts.some((obj) => obj.label === "person");
          // send the prediction out
          node.send(msg);
        });
      }
    });
  }

  // register the node with the runtime
  RED.nodes.registerType("tfjs-tutorial-node", TfjsTutorialNode);
};
