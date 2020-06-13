var VolumeMonitor = function (audioNode, div, context) {
    this.analyser = context.createAnalyser();
    this.audioNode = audioNode;
    this.div = div;
    audioNode.connect(this.analyser);

    this.sampleBuffer = new Float32Array(this.analyser.fftSize);
    
    this.channelCount = 1; //this.analyser.channelCount;
        
    for (var i = 0; i < this.channelCount; i++) {
      //this.channelPeaks[i] = 0.0;
    }
    
    this.step = 0
};

VolumeMonitor.prototype.remove = function () {
    this.audioNode.disconnect(this.analyser);
};


VolumeMonitor.prototype._loop_power = 0
VolumeMonitor.prototype._loop_i = 0
VolumeMonitor.prototype._loop_meterDimension = 48
VolumeMonitor.prototype.updateMeter = function () {
 //   console.log(this.analyser)
  this.analyser.getFloatTimeDomainData(this.sampleBuffer);

  // Compute average power over the interval.
  /*let sumOfSquares = 0;
  for (let i = 0; i < this.sampleBuffer.length; i++) {
    sumOfSquares += this.sampleBuffer[i] ** 2;
  }
  const avgPowerDecibels = 10 * Math.log10(sumOfSquares / this.sampleBuffer.length);*/
  
  // Compute peak instantaneous power over the interval.
  this.peakInstantaneousPower = 0;
  for (this._loop_i = 0; this._loop_i < this.sampleBuffer.length; this._loop_i++) {
    this._loop_power = this.sampleBuffer[this._loop_i] ** 2;
    this.peakInstantaneousPower = Math.max(this._loop_power, this.peakInstantaneousPower);
  }

  this.volume = this.peakInstantaneousPower
  return
  this.peakInstantaneousPowerDecibels = 10 * Math.log10(this.peakInstantaneousPower);

  this.step++
  if (this.step === 10) {
    console.log(this.peakInstantaneousPower, this.peakInstantaneousPowerDecibels)
    this.step = 0
  }

  if (this.peakInstantaneousPowerDecibels === -Infinity) {
    this.volume = 0;
  } else {
    this.volume = 1 - (this.peakInstantaneousPowerDecibels / -80) //* this._loop_meterDimension / d;
    if (this.volume < 0.1) {
      this.volume = 0;
    }
  }
  this.volume = this.volume * this.volume
  //console.log(this.volume)
};