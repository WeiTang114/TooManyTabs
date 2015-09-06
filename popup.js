function queryTabs() {
  chrome.tabs.query({currentWindow: true}, showTabs);
}

var _tabs;
function showTabs(tabs) {
  _tabs = tabs;
  var list = $('#tabs');
  list.empty();
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
      text: t.title,
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
    list.append(href);
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
  var list = $('#tabs');

  $('html').height(list.height());
  console.log('new height:' + list.height());
  list.css('overflowY', 'auto');
  list.css('max-height', Math.min(list.height(), 600));
}

function highlightActiveTab() {
  chrome.tabs.query({currentWindow:true, active: true}, function(tabs) {
    var idx = tabs[0].index;
    $($('#tabs').find('.item').get(idx))
        .addClass('active');
  });
}

document.addEventListener('DOMContentLoaded', function () {
  queryTabs();
});
