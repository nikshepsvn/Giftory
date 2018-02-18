var WordPOS = require('wordpos'), wordpos = new WordPOS();
var giphy = require( 'giphy' )(INSERT_API_KEY_AS_STRING_HERE);
const async = require('async');
var download = require('download-file');
var fs = require('fs');
var ffmpeg = require('fluent-ffmpeg');

const { parse, stringify, resync, toMS, toSrtTime } = require('subtitle');

var story = ["Jack and Jill went up the Hill to fetch a pail of water", "Jill fell down and broke her Crown", "Jack came tumbling after"];

var gifMap = new Map();

function generateArrayOfSentencesFromStory(rawstory){
  story = rawstory.split('.');
}

function getGifFromKeyword(keywords, callback){
  giphy.search({q: keywords, limit:1}, (err, data)=>{
    return callback(data);
  });
}

function getKeywordFromSentence(sentence, callback){
  wordpos.getNouns(sentence, function(result){
    return callback(result);
  });
}

function createArrayOfGifs(story, fallback){
  var count = 0;
    async.eachSeries(story, (sentence, callback) =>{
      getKeywordFromSentence(sentence, (keywords)=>{
        getGifFromKeyword(keywords, (data) =>{
          var options = {
              directory: "./story/",
              filename: count+".mp4"
          }
          gifMap.set(sentence, "/story/" + count + ".mp4");
          download(data["data"][0]["images"]["looping"]["mp4"], options, function(err){
              if (err) throw err
              callback(null);
              if(count == story.length){
                fallback(null);
              }
          });
          ++count;
        })
      });
    });
}

function generateSrtFile(gifMap, callback){
  var srt = [];
  var last = 0;

  for(sentence in story){
    var time = 0.3*sentence.split(' ').length*9000;
    srt.push({start: last, end: last+time, text:story[sentence]});
    last = last + time;
  }

  const srtres = stringify(srt);

  fs.writeFile("./story/subtitles.srt", srtres, function(err) {
    if(err) {
        return console.log(err);
    }
    callback(null);
  });
}

function embedSrtIntoVideo(callback){
  var command = ffmpeg();
  command.input("./story/processed.mp4")
  .outputOptions('-vf subtitles=./story/subtitles.srt')
  .on('error', function(err) {
      callback(true, err)
  })
  .save('./story/final.mp4')
  .on('end', function() {
      callback(null, "done");
  }).run();
}

function trimVideos(fallback){
  var count = 0;
  async.eachSeries(gifMap, (video, callback) =>{
    var time = 0.5*video[0].split(' ').length;
    var command = ffmpeg();
    command.input("."+video[1])
    .setStartTime("00:00:00")
    .setDuration(time)
    .size('640x480').aspect('16:9').autopad().fps(25).videoCodec('libx264')
    .output("./story/"+count+"_processed.mp4")
    .on('end', function(err) {
        if(!err)
        {
          callback(null);
        }
      })
      .on('error', function(err){
          console.log('error: ', err);
      }).run();
      ++count;
  }, () =>{
    fallback(null);
  });
}

function mergeVideos(callback){
  var mergedVideo = ffmpeg();

  var count = 0;
  gifMap.forEach(function(video){
      mergedVideo.addInput("./story/"+count+"_processed.mp4");
      ++count;
  });

  mergedVideo.mergeToFile('./story/processed.mp4', './story')
  .on('error', function(err) {
      console.log('Error2 ' + err.message);
  })
  .on('end', function() {
      console.log('Finished!');
      callback(null);
  });
}

function makeMovie(callback){
  createArrayOfGifs(story, ()=>{
    generateSrtFile(gifMap, ()=>{
      trimVideos(()=>{
        mergeVideos(()=>{
          embedSrtIntoVideo(()=>{
            callback(null);
          })
        })
      })
    })
  })
}

 makeMovie(() => {
   console.log("Giftory generation completed.");
 });
