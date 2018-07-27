const storage = require('azure-storage');
const mu = require('mu2');
const request = require('request');

module.exports = function (context, myTimer) {
    
    //mu.root = 'd:\\home\\site\\wwwroot\\templates'
    mu.clearCache();

    var mynews;
    const mylinks = [
        {'url':'http://medienstudio.net'}, 
        {'url': 'https://windowsarea.de'}, 
        {'url': 'https://github.com'}
    ];

    getData();
    
    function getData(){
        context.log('get data');

        var options = {
            url: 'https://windowsarea.de/wp-json/wp/v2/posts',
            method: 'GET',
            json: true
        }
        request(options, function (error, response, data) {

            context.log("request callback");
            if (error) {
                context.log(error);
            }
            else {
                context.log(data.length);
                mynews = data;
            }

            prepareTemplates();
        });
    }

    function prepareTemplates(){
        context.log('prepare Templates');
        mu.compileText('header.mustache', context.bindings.headerTemplate, function () {
            mu.compileText('footer.mustache', context.bindings.footerTemplate, function () {
                renderSite();
            });
        });
    }

    function renderSite(){
        context.log("render site");
        var pageFile = "";
        mu.compileText('index.mustache', context.bindings.indexTemplate, function (err, parsed) {
            var renderstream = mu.render(parsed, { news: mynews, links: mylinks });
            renderstream.on('data', function (data) {
                pageFile += data;
            });
            renderstream.on('end', function (data) {
                context.log("done creating index.html");
                uploadSite(pageFile);
            });
        });
    }

    function uploadSite(page){
        context.log("Upload site ");
        var blobService = storage.createBlobService();

        // create $web container
        blobService.createContainerIfNotExists('$web', function(){

            // upload index.html to $web container
            const options = { contentSettings: { contentType: 'text/html' } }
            blobService.createBlockBlobFromText("$web", "index.html", page, options, function (error) {
                context.log("uploaded");
                context.done();
            });
        });
    }
};