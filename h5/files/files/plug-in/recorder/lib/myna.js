﻿(function(window) {
    //兼容
    window.URL = window.URL || window.webkitURL;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia||navigator.getmozGetUserMedia;

    var Myna = function(stream, config) {
        config = config || {};
        config.sampleBits = config.sampleBits || 16; //采样数位 8, 16
        config.sampleRate = config.sampleRate || 11025; //采样率(1/6 44100)

        var context = new(window.webkitAudioContext || window.AudioContext)();
        var audioInput = context.createMediaStreamSource(stream);
        var createScript = context.createScriptProcessor || context.createJavaScriptNode;
        var recorder = createScript.apply(context, [4096, 1, 1]);

        var audioData = {
            size: 0,   //录音文件长度
            buffer: [],  //录音缓存
            inputSampleRate: context.sampleRate, //输入采样率
            inputSampleBits: 16, //输入采样数位 8, 16
            outputSampleRate: config.sampleRate, //输出采样率
            oututSampleBits: config.sampleBits, //输出采样数位 8, 16
            input: function(data) {
                this.buffer.push(new Float32Array(data));
                this.size += data.length;
            },
            compress: function() { //合并压缩
                //合并
                var data = new Float32Array(this.size);
                var offset = 0;
                for (var i = 0; i < this.buffer.length; i++) {
                    data.set(this.buffer[i], offset);
                    offset += this.buffer[i].length;
                }
                //压缩
                var compression = parseInt(this.inputSampleRate / this.outputSampleRate);
                var length = data.length / compression;
                var result = new Float32Array(length);
                var index = 0,
                    j = 0;
                while (index < length) {
                    result[index] = data[j];
                    j += compression;
                    index++;
                }
                return result;
            },
            encodeWAV: function() {
                var sampleRate = Math.min(this.inputSampleRate, this.outputSampleRate);
                var sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits);
                var bytes = this.compress();
                var dataLength = bytes.length * (sampleBits / 8);
                var buffer = new ArrayBuffer(44 + dataLength);
                var data = new DataView(buffer);

                var channelCount = 1; //单声道
                var offset = 0;

                var writeString = function(str) {
                    for (var i = 0; i < str.length; i++) {
                        data.setUint8(offset + i, str.charCodeAt(i));
                    }
                }

                // 资源交换文件标识符 
                writeString('RIFF');
                offset += 4;
                // 下个地址开始到文件尾总字节数,即文件大小-8 
                data.setUint32(offset, 36 + dataLength, true);
                offset += 4;
                // WAV文件标志
                writeString('WAVE');
                offset += 4;
                // 波形格式标志 
                writeString('fmt ');
                offset += 4;
                // 过滤字节,一般为 0x10 = 16 
                data.setUint32(offset, 16, true);
                offset += 4;
                // 格式类别 (PCM形式采样数据) 
                data.setUint16(offset, 1, true);
                offset += 2;
                // 通道数 
                data.setUint16(offset, channelCount, true);
                offset += 2;
                // 采样率,每秒样本数,表示每个通道的播放速度 
                data.setUint32(offset, sampleRate, true);
                offset += 4;
                // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8 
                data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
                offset += 4;
                // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8 
                data.setUint16(offset, channelCount * (sampleBits / 8), true);
                offset += 2;
                // 每样本数据位数 
                data.setUint16(offset, sampleBits, true);
                offset += 2;
                // 数据标识符 
                writeString('data');
                offset += 4;
                // 采样数据总数,即数据总大小-44 
                data.setUint32(offset, dataLength, true);
                offset += 4;
                // 写入采样数据 
                if (sampleBits === 8) {
                    for (var i = 0; i < bytes.length; i++, offset++) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        var val = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        val = parseInt(255 / (65535 / (val + 32768)));
                        data.setInt8(offset, val, true);
                    }
                } else {
                    for (var i = 0; i < bytes.length; i++, offset += 2) {
                        var s = Math.max(-1, Math.min(1, bytes[i]));
                        data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                    }
                }

                return new Blob([data], { type: 'audio/wav'});
                // var blob=new Blob([data], { type: 'audio/wav'});
                // blob.name='blob.wav';
                // return blob;
            }
        };

        //开始录音
        this.start = function() {
            audioInput.connect(recorder);
            recorder.connect(context.destination);
        }

        // 暂停继续
        this.pause = function() {
            console.log(context.state);
            if (context.state === 'running') {
                context.suspend().then(function() {
                });
            } else if (context.state === 'suspended') {
                context.resume().then(function() {
                });
            }
        }

        //停止
        this.stop = function() {
            context.close().then(function(){
                recorder.disconnect();
            });
            
            console.log(this.getBlob);
        }

        //获取音频文件
        this.getBlob = function() {
            this.stop();
            return audioData.encodeWAV();
        }

        // 获取音频文件
        this.getBlobData = function(audio){
            console.log(audioData.encodeWAV());
            // return audioData.encodeWAV();
            // $('#audio').attr('src', window.URL.createObjectURL(this.getBlob()));
            audio.src = window.URL.createObjectURL(this.getBlob());
            //var fr=new FileReader();
            //fr.readAsDataURL(this.getBlob());
            //fr.onload=function(e){
            //    console.log('blob:url===================================================');
            //    console.log(audio.src);
            //    console.log('base:64===================================================');
            //    console.log(this.result);
            //}
        }

        //回放
        this.play = function(audio) {
            console.log(window.URL.createObjectURL(this.getBlob()))
            audio.src = window.URL.createObjectURL(this.getBlob());
        }

        this.download = function(saveAudio) {
            var url = window.URL.createObjectURL(this.getBlob());
            console.log(url);
            saveAudio.href = url;
            saveAudio.download = 'output.wav';
        }

        this.audioFile = function(){
            return audioData.encodeWAV();
        }

        //上传
        this.upload = function(url, callback) {
        }

        //音频采集
        recorder.onaudioprocess = function(e) {
            audioData.input(e.inputBuffer.getChannelData(0));
            //record(e.inputBuffer.getChannelData(0));
        }

    };

    //抛出异常
    Myna.throwError = function(message) {
            alert(message);
            throw new function() { this.toString = function() {
                    return message; } }
        }
        //是否支持录音
    Myna.canRecording = (navigator.getUserMedia != null);
    //获取录音机
    Myna.get = function(callback, config) {
        if (callback) {
            if (navigator.getUserMedia) {
                navigator.getUserMedia({ audio: true } //只启用音频
                    ,
                    function(stream) {
                        var rec = new Myna(stream, config);
                        callback(rec);
                    },
                    function(error) {
                        $('.error').css('display', 'block');
                        $('.error-btn').click(function(){
                            $('.error').hide();
                        })
                        switch (error.code || error.name) {
                            case 'PERMISSION_DENIED':
                            case 'PermissionDeniedError':
                                //Myna.throwError('用户拒绝提供信息。');
                                Myna.throwError('请调整浏览器设置。');
                                break;
                            case 'NOT_SUPPORTED_ERROR':
                            case 'NotSupportedError':
                                Myna.throwError('浏览器不支持硬件设备。');
                                break;
                            case 'MANDATORY_UNSATISFIED_ERROR':
                            case 'MandatoryUnsatisfiedError':
                                Myna.throwError('无法发现指定的硬件设备。');
                                break;
                            default:
                                Myna.throwError('无法打开麦克风。异常信息:' + (error.code || error.name));
                                break;
                        }
                    });
            } else {
                Myna.throwErr('当前浏览器不支持录音功能。');
                return;
            }
        }
    }

    window.Myna = Myna;

})(window);
