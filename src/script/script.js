;(function() {

  'use strict'

  const GOOGLE_BOOK_ENDPOINT = 'https://www.googleapis.com/books/v1/volumes?q=';
  const PACKART_PLACEHOLDER = 'http://www.placehold.it/80x100';
  const SEARCH_ERROR_MESSAGE = 'There was an error with your query. Please perform another search query.';
  const SEARCH_THROTTLE_TIME = 500;

  init();

  function init() {
    $('.search-input').addEventListener('keyup', debounce(onKeyupSearch, SEARCH_THROTTLE_TIME));
    attachDynamicEvent('click', 'search-book__add-btn', onClickAddBook);
    attachDynamicEvent('click', 'saved-book__remove-btn', onClickRemoveBook);
  }

  function onClickAddBook(e) {
    let parentNode = e.target.parentNode;
    let data = {
       title: parentNode.getAttribute('data-title'),
       author: parentNode.getAttribute('data-author'),
       description: parentNode.getAttribute('data-description'),
       pages: parentNode.getAttribute('data-pagecount'),
       packart: parentNode.getAttribute('data-packart'),
       link: parentNode.getAttribute('data-link')
    };

    renderSavedBook(data);
    parentNode.parentNode.removeChild(parentNode); // remove added book from search list
  }

  function onClickRemoveBook(e) {
    let parentNode = e.target.parentNode;
    parentNode.parentNode.removeChild(parentNode);
  }

  function onKeyupSearch(e) {
    let value = e.target.value;
    value = value.replace(' ', '+');
    jsonp(GOOGLE_BOOK_ENDPOINT + value, renderBookList);
  }

  function renderBookList(data) {
    let template = $('.search-book-template');

    deleteElements($('.search-book')); // clear search list
    $('.search-error').innerText = ''; // clear search error message

    if (data && data.items) {
      data.items.forEach((book) => {
        let clone = document.importNode(template.content, true);
        let volumeInfo = book.volumeInfo || {};
        let title = volumeInfo.title || '';
        let link = volumeInfo.infoLink || '';
        let author = typeof volumeInfo.authors !== 'undefined' ? volumeInfo.authors.join(', ')  : '';
        let description = volumeInfo.description || '';
        let pageCount = volumeInfo.pageCount || '';
        let packart = typeof volumeInfo.imageLinks !== 'undefined' ? volumeInfo.imageLinks.thumbnail : PACKART_PLACEHOLDER;

        clone.querySelector('.search-book').setAttribute('data-title', title);
        clone.querySelector('.search-book').setAttribute('data-author', author);
        clone.querySelector('.search-book').setAttribute('data-description', description);
        clone.querySelector('.search-book').setAttribute('data-pageCount', pageCount);
        clone.querySelector('.search-book').setAttribute('data-packart', packart);
        clone.querySelector('.search-book').setAttribute('data-link', link);
        clone.querySelector('.search-book__title').textContent = title;
        clone.querySelector('.search-book__title').setAttribute('href', link);
        clone.querySelector('.search-book__author').textContent = author;

        $('.search-list').append(clone);

      });
    } else {
      $('.search-error').innerText = SEARCH_ERROR_MESSAGE;
    }
  }

  function renderSavedBook({title, author, description, pages, packart, link}) {
    let template = $('.saved-book-template');
    let clone = document.importNode(template.content, true);

    clone.querySelector('.saved-book__title').textContent = title.length ? title : '';
    clone.querySelector('.saved-book__title').setAttribute('href', link);
    clone.querySelector('.saved-book__author').textContent = author.length ? author : '';
    clone.querySelector('.saved-book__description').textContent = description.length ? description : '';
    clone.querySelector('.saved-book__pages').textContent = pages.length ? `${pages} pages` : '';
    clone.querySelector('.saved-book__packart').setAttribute('src', packart);

    $('.saved-list').append(clone);
  }

  
  // UTILITY/POLYFILLS

  // mimic jQuery selector
  function $(selector) {
    let ele = document.querySelectorAll(selector);

    if (ele.length === 1) {
      return ele[0]
    }
    
    return ele;
  };

  // mimic jQuery on()
  function attachDynamicEvent(eventType, className, callback) {
    document.body.addEventListener(eventType, (e) => {
      let element = e.srcElement || e.target; // Firefox doesn't support e.srcElement
      if(element.className === className) {
        callback(e);
      };
    });
  }

  // taken from: https://davidwalsh.name/javascript-debounce-function
  function debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  // taken from: https://stackoverflow.com/questions/4777077/removing-elements-by-class-name
  function deleteElements(elms) {
    Array.from(elms).forEach(el => el.remove());
  }

  // taken from: https://stackoverflow.com/questions/22780430/javascript-xmlhttprequest-using-jsonp
  function jsonp(url, callback) {
      let callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      window[callbackName] = function(data) {
          delete window[callbackName];
          document.body.removeChild(script);
          callback(data);
      };

      let script = document.createElement('script');
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
      document.body.appendChild(script);
  }

  // taken from: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
  (function polyfillArrayAppend(arr) {
    arr.forEach(function (item) {
      if (item.hasOwnProperty('append')) {
        return;
      }
      Object.defineProperty(item, 'append', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: function append() {
          var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();
          
          argArr.forEach(function (argItem) {
            var isNode = argItem instanceof Node;
            docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
          });
          
          this.appendChild(docFrag);
        }
      });
    });
  })([Element.prototype, Document.prototype, DocumentFragment.prototype]);

  // taken from: https://gist.github.com/brettz9/6093105
  (function polyfillArrayFrom() {
    if (!Array.from) {
        Array.from = function (object) {
            'use strict';
            return [].slice.call(object);
        };
    }
  })();

  // taken from: https://stackoverflow.com/questions/16055275/html-templates-javascript-polyfills
  (function polyfillTemplate(d) {
    if('content' in d.createElement('template')) {
        return false;
    }

    var qPlates = d.getElementsByTagName('template'),
      plateLen = qPlates.length,
      elPlate,
      qContent,
      contentLen,
      docContent;

    for(var x=0; x<plateLen; ++x) {
      elPlate = qPlates[x];
      qContent = elPlate.childNodes;
      contentLen = qContent.length;
      docContent = d.createDocumentFragment();

      while(qContent[0]) {
          docContent.appendChild(qContent[0]);
      }

      elPlate.content = docContent;
    }
  })(document);
})();