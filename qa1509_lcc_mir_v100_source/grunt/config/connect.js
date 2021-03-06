module.exports = function (grunt, options) {

  var port = grunt.option('port') || 9002;

  return {
    server: {
      options: {
        port: port,
        base: '<%= outputdir %>',
        keepalive:true
      }
    },
    spoorOffline: {
      options: {
        port: port,
        base: '<%= outputdir %>',
        keepalive:true
      }
    }
  }
}
