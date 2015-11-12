'use strict';

var express = require('express'),
    fs = require('fs'),
    http = require('http'),
    mkdirp = require('mkdirp'),
    nconf = require('nconf'),
    uuid = require('node-uuid');

nconf.argv().env();

// set up output folder
var output = nconf.get('outputFolder') || './output';
mkdirp(output);

var app = express();

app.use(require('body-parser').urlencoded({ extended: true, limit: '5mb' }));
app.use(require('body-parser').json({limit: '5mb'}));

var responseTemplate = fs.readFileSync(__dirname + '/response_template.txt', { encoding: 'utf-8' });
var errorTemplate = fs.readFileSync(__dirname + '/error_template.txt', { encoding: 'utf-8' });

app.use(function (req, res) {
  var id = uuid.v4();

  // for now we only support sending
  if (req.body.Action === 'SendEmail') {
    // log recipient, subject, and body length to console
    console.log('Email received:');
    console.log({
      Source: req.body.Source,
      Destination: req.body['Destination.ToAddresses.member.1'],
      Subject: req.body['Message.Subject.Data'],
      HtmlSize: req.body['Message.Body.Html.Data'].length,
      TextSize: req.body['Message.Body.Text.Data'].length
    });

    // save the email to the output folder
    try {
      mkdirp.sync(output + '/' + id);
      fs.writeFileSync(output + '/' + id + '/content.html', req.body['Message.Body.Html.Data']);
      fs.writeFileSync(output + '/' + id + '/content.txt', req.body['Message.Body.Text.Data']);
      fs.writeFileSync(output + '/' + id + '/subject.txt', req.body['Message.Subject.Data']);
      fs.writeFileSync(output + '/' + id + '/destination.txt', req.body['Destination.ToAddresses.member.1']);
      fs.writeFileSync(output + '/' + id + '/source.txt', req.body.Source);
      res.status(200).send(responseTemplate.replace('@@@messageId@@@', id));
    } catch (err) {
      console.log('Error saving email', err);
      res.status(500).send(errorTemplate.replace('@@@code@@@', 'MessageRejected').replace('@@@message@@@', err.message));
    }
  } else if (req.body.Action === 'SendRawEmail') {
    console.log('Raw Email received');

    // save the email to the output folder
    try {
      mkdirp.sync(output + '/' + id);
      fs.writeFileSync(output + '/' + id + '/content.eml', new Buffer(req.body['RawMessage.Data'], 'base64').toString());
      res.status(200).send(responseTemplate.replace('@@@messageId@@@', id));
    } catch (err) {
      console.log('Error saving email', err);
      res.status(500).send(errorTemplate.replace('@@@code@@@', 'MessageRejected').replace('@@@message@@@', err.message));
    }
  } else {
    res.status(400).send('Invalid action: ' + req.body.Action);
  }
});

var server = http.createServer(app);
var port = nconf.get('port') || 9555;
server.listen(port, function () {
  console.log('SES mock server listening on port ' + port);
});
