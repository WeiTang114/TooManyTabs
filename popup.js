var _list;

function queryTabs() {
  chrome.tabs.query({currentWindow: true}, showTabs);
}

var _tabs;
const Item = (title, favIconUrl) => `
  <a href="#" class="list-group-item item" tabindex="-1">
    <img src="${favIconUrl}" style="width: 15px; height: 15px; float: left; margin-right: 10px; margin-bottom: 10px;">
    <span class="glyphicon glyphicon-remove-circle pull-right close-btn" style="margin-left: 10px; font-size: 16px;"></span>
    <div class="text">${title}</div>
  </a>
`;

function showTabs(tabs) {
  _tabs = tabs;
  _list.empty();
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    var title = t.title;
    if (!title || !/\S/.test(title)) {
      title = 'blank';
    }

    var item = $(Item(title, t.favIconUrl));
    _list.append(item);
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
    var item = $($('#tabs').find('.item').get(idx));
    item.addClass('active');

    // disable click function of the item
    item.off('click');

    // disable close for current tab
    item.find('.close-btn')
        .css('pointer-events', 'none')
        .css('display', 'none');
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


function initArrowKeys() {
  function keyup() {

  }

  function keydown() {

  }

  switch(e.which) {
    case 38: // up
      keyup();
      break;
    case 40: // down
      keydown();
      break;
    default: return; // exit this handler for other keys
  }
  e.preventDefault(); // prevent the default action (scroll / move car
}

document.addEventListener('DOMContentLoaded', function () {
  _list = $('#tabs');
  queryTabs();
  initFilter();
  initArrowKeys();
});
