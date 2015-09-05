function queryTabs() {
  chrome.tabs.query({currentWindow: true}, showTabs);
}

var _tabs;
function showTabs(tabs) {
  _tabs = tabs;
  var list = $('#tabs');
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

    href.append(icon);
    href.append(div);
    list.append(href);
  }

  $('html').height(list.height());
  list.css('overflowY', 'auto');
  list.height(Math.min(list.height(), 600));


  highlightActiveTab();

  $('.item').click(function() {
    var idx = $(this).index();
    console.log(idx);
    chrome.tabs.update(_tabs[idx].id, {active: true});
    window.close();
  });
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
