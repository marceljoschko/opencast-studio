const NODES_NUM = 6;

export default class EqualizerNode {
  constructor(audioContext) {
    this.eqNodes = [];

    for (let i = 0; i < NODES_NUM; i++) {
      let eqNode = audioContext.createBiquadFilter();
      this.eqNodes.push(eqNode);
    }

    this.eqNodes[5]
      .connect(this.eqNodes[4])
      .connect(this.eqNodes[3])
      .connect(this.eqNodes[2])
      .connect(this.eqNodes[1])
      .connect(this.eqNodes[0]);
  }

  getEqNode(i) {
    if (i >= 0 && i < NODES_NUM) return this.eqNodes[i];
    else return null;
  }

  frequencyHandler(node, value) {
    this.eqNodes[node].frequency.value = value;
  }

  resonanceHandler(node, value) {
    this.eqNodes[node].Q.value = value;
  }

  gainHandler(node, value) {
    this.eqNodes[node].gain.value = value;
  }

  loadPreset(jsondata) {
    for (let i = 0; i < this.eqNodes.length; i++) {
      let preset = jsondata['filter' + i];
      let eqNode = this.eqNodes[i];
      eqNode.type = preset.type.toString();
      eqNode.frequency.value = preset.freq;
      eqNode.Q.value = preset.q;
      eqNode.gain.value = preset.gain;
    }
  }

  getSettings() {
    let jsondata = { filter0: {}, filter1: {}, filter2: {}, filter3: {}, filter4: {}, filter5: {} };
    for (let i = 0; i < this.eqNodes.length; i++) {
      let preset = { type: '', freq: 0, q: 0, gain: 0 };
      let eqNode = this.eqNodes[i];
      preset.type = eqNode.type.value;
      preset.freq = eqNode.frequency.value;
      preset.q = eqNode.Q.value;
      preset.gain = eqNode.gain.value;
      jsondata['filter' + i] = preset;
    }
    return jsondata;
  }
}
