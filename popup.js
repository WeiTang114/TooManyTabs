var _list;

function queryTabs() {
  chrome.tabs.query({currentWindow: true}, showTabs);
}

var _tabs;
function showTabs(tabs) {
  _tabs = tabs;
  _list.empty();
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    console.log(t.title);
    var href = $('<a />', {
      href: '#',
      class: 'list-group-item item',
      tabindex: -1
    });

    var icon = $('<img />', {
      src: t.favIconUrl,
      width: 15,
      height: 15
    });
    icon.css('float', 'left');
    icon.css('margin-right', 10);
    icon.css('margin-bottom', 10);

    var div = $('<div />', {
      text: t.title ? t.title : 'blank',
      class: 'text'
    });

    var badge = $('<span />', {
      class: 'glyphicon glyphicon-remove-circle pull-right close-btn',
    });
    badge.css('margin-left', 10);
    badge.css('font-size', 16);

    href.append(icon);
    href.append(badge);
    href.append(div);
    _list.append(href);
  }

  updateLayout();
  highlightActiveTab();

  $('.item').click(function() {
    var idx = $(this).index();
    console.log(idx);
    chrome.tabs.update(_tabs[idx].id, {active: true});
    window.close();
  });

  $('.close-btn').click(function() {
    // stop the event from triggering the '.item' click callback
    event.stopPropagation();

    var item = $(this).parent();
    var idx = item.index();
    chrome.tabs.remove(_tabs[idx].id, function() {
      item.remove();
      _tabs.splice(idx, 1);

      updateLayout();
    });

  });
}

function updateLayout() {

  console.log('new height:' + _list.height());
  _list.css('overflowY', 'auto');
  _list.css('max-height', Math.min(_list.height(), 550));
  _list.css('margin-bottom', '0px');
  $('html').height(_list.height() + 45);
}


function highlightActiveTab() {
  chrome.tabs.query({currentWindow:true, active: true}, function(tabs) {
    var idx = tabs[0].index;
    $($('#tabs').find('.item').get(idx))
        .addClass('active');
  });
}

// This is from Kilian:
//     http://kilianvalkhof.com/2010/javascript/how-to-build-a-fast-simple-list-filter-with-jquery/
function initFilter() {
  jQuery.expr[':'].Contains = function(a,i,m){
    return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
  };

  $('#searchinput').change(function() {
    var filter = $(this).val();
    console.log(filter);
    if (filter) {
      $('#searchclear').show();
      _list.find("div:not(:Contains(" + filter + "))").parent().slideUp();
      _list.find("div:Contains(" + filter + ")").parent().slideDown();
    } else {
      $('#searchclear').hide();
      _list.find(".item").slideDown();
    }
  }).keyup(function() {
    $(this).change();
  });

  $('#searchclear').click(function() {
    $('#searchinput').val('').focus().change();
    $(this).hide();
  });
}


document.addEventListener('DOMContentLoaded', function () {
  _list = $('#tabs');
  queryTabs();
  initFilter();
});
