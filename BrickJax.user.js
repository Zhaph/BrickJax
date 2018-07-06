// ==UserScript==
// @name          BrickJax
// @namespace     https://brickjax.doodle.uk/
// @description   Supplies Brick images for https://bricks.stackexchange.com/
// @homepage      https://brickjax.doodle.uk/
// @grant         GM_xmlhttpRequest
// @grant         GM_log
// @connect       brickjax.doodle.uk
// @connect       brickjax.doodle.co.uk
// @include       https://bricks.stackexchange.com/*
// @include       https://bricks.meta.stackexchange.com/*
// @include       https://chat.stackexchange.com/rooms/1741/*
// @include       https://chat.stackexchange.com/rooms/1653/*
// @include       https://stackapps.com/*
// @require       https://ajax.googleapis.com/ajax/libs/jquery/1.5.2/jquery.min.js
// @author        Kevin Cathcart and @Zhaph
// @version       1.0.8
// @updateURL     https://github.com/Zhaph/BrickJax/raw/master/BrickJax.user.js
// ==/UserScript==

/*
* BrickJax v0.12.4
* Copyright (c) 2011 Kevin Cathcart
* Designed to supply brick images for https://bricks.stackexchange.com/
* Based on content containing [part:partid:colorid]
* Ben Duguid: Added Peeron, BrickLink and BrickSet links for set details
*
* The searchText functions based on:
* jQuery replaceText
* Copyright (c) 2009 "Cowboy" Ben Alman
* Dual licensed under the MIT and GPL licenses.
* http://benalman.com/about/license/
*/

(function ($) { $.fn.replaceText = function (b, a, c) { return this.each(function () { var f = this.firstChild, g, e, d = []; if (f) { do { if (f.nodeType === 3) { g = f.nodeValue; e = g.replace(b, a); if (e !== g) { if (!c && /</.test(e)) { $(f).before(e); d.push(f) } else { f.nodeValue = e } } } } while (f = f.nextSibling) } d.length && $(d).remove() }) } })($);

var brickJax = (function ($) {
    "use strict";
    var brickJax = {};

    function log(obj) {
        return;
        if (window.console) {
            console.log(obj);
        }
    }

    function buildImage(ajaxData) {
        log("Entered buildImage");

        var text = '<img style="max-height:100px;" src="' + ajaxData.Src + '" alt="' + ajaxData.AltText + '" />';

        return text;
    }

    function buildLink(ajaxData) {
        log("Entered buildLink");

        var text = '<a href="http://www.peeron.com/inv/parts/' + ajaxData.PartId + '">' + ajaxData.BrickName;
        if (ajaxData.BrickName.indexOf(ajaxData.PartId) == -1) {
            text += " (" + ajaxData.PartId + ")";
        }
        text += ' <img style="max-height:100px;" src="' + ajaxData.Src + '" alt="in ' + ajaxData.ColourName + '" /></a>';
        return text;
    }

    function replaceSet(node, str, number, colour) {
        log("Entered replaceSet");
        log(str, number, colour, node);

        var text = '<a href="http://www.peeron.com/inv/sets/' + number + '-1">' + number + ' on Peeron</a>';

        $(node).replaceText(str, text);
    }

    function replaceBrickSet(node, str, number, colour) {
        log("Entered replaceBrickSet");
        log(str, number, colour, node);

        var text = '<a href="https://brickset.com/detail/?Set=' + number + '-1">' + number + ' on BrickSet</a>';

        $(node).replaceText(str, text);
    }

    function replaceBrickLink(node, str, number, colour) {
        log("Entered replaceBrickLink");
        log(str, number, colour, node);

        var text = '<a href="https://www.bricklink.com/catalogItem.asp?S=' + number + '-1">' + number + ' on BrickLink</a>';

        $(node).replaceText(str, text);
    }

    function replaceImage(node, str, number, colour) {
        log("Entered replaceImage");
        log(str, number, colour, node);

        getBricksForImage(number, colour, node, str);
    }

    function replaceLink(node, str, number, colour) {
        log("Entered replaceLink");
        log(str, number, colour, node);

        getBricksForLink(number, colour, node, str);
    }

    function searchText(elements, regex, toInvoke) {
        log("Entered searchText");
        elements.each(function () {
            var parent = this, node = this.firstChild;

            // Only continue if firstChild exists.
            if (node) {

                // Loop over all childNodes.
                do {

                    // Only process text nodes.
                    if (node.nodeType === 3) {
                        node.nodeValue.replace(regex, function (str) {
                            var args = Array.prototype.slice.call(arguments);
                            args.unshift(parent);
                            log(args);
                            toInvoke.apply(null, args);
                            return str;
                        });
                    }
                } while (node = node.nextSibling);
            }
        });
    }

    function replaceTags(element) {
        log("Entered replaceTags");

        var elements = $(element).find('*').andSelf();
        elements = elements.not($('script,noscript,style,textarea,pre,code').find('*').andSelf());

        searchText(elements, /\[part:([\w\-]*)(?::([\w\-]*))?\]/gi, replaceImage);
        searchText(elements, /\[partlink:([\w\-]*)(?::([\w\-]*))?\]/gi, replaceLink);

        searchText(elements, /\[set:([\w\-]*)(?::([\w\-]*))?\]/gi, replaceSet);
        searchText(elements, /\[bs:([\w\-]*)(?::([\w\-]*))?\]/gi, replaceBrickSet);
        searchText(elements, /\[bl:([\w\-]*)(?::([\w\-]*))?\]/gi, replaceBrickLink);

        log("Leaving replaceTags");
    }

    function getBricksForImage(number, colour, node, str) {
        log("Entered getBricksForImage");

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://brickjax.doodle.uk/bricks/Details/" + number + "/" + colour + "/json.js",
            dataType: "jsonp",
            onload: function (data) {
                $(node).replaceText(str, buildImage($.parseJSON(data.responseText)));
            }
        });
    }

    function getBricksForLink(number, colour, node, str) {
        log("Entered getBricksForLink");

        GM_xmlhttpRequest({
            method: "POST",
            url: "https://brickjax.doodle.uk/bricks/Details/" + number + "/" + colour + "/json.js",
            dataType: "jsonp",
            onload: function (data) {
                $(node).replaceText(str, buildLink($.parseJSON(data.responseText)));
            }
        });
    }

    brickJax.buildLink = buildLink;
    brickJax.buildImage = buildImage;
    brickJax.getBricksForImage = getBricksForImage;
    brickJax.getBricksForLink = getBricksForLink;
    brickJax.replaceTags = replaceTags;
    return brickJax;
})($);

brickJax.replaceTags($('body'));
