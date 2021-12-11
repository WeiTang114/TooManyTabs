var _list;
var _tabs;
var _selectMode = false;
var _selected = [];
var _filter = '';
var _focus = {
  value: 0,
  callback(old, neww) {
    console.log(`The variable has changed to ${this.at}`);
  },
  get at() {
    return this.value;
  },
  set at(value) {
    var old = this.value;
    this.value = value;
    this.callback(old, value);
  }
}

const Item = (tabid, title, favIconUrl, url) => `
  <a data-tabid="${tabid}" href="#" class="list-group-item item" tabindex="-1">
    <div class="fa fa-check check"></div>
    <img class="favicon" src="${favIconUrl}">
    <span class="glyphicon glyphicon-remove-circle pull-right close-btn"></span>
    <div class="text">${title}</div>
    <div class="url">${url}</div>
  </a>
`;


function queryTabs() {
  chrome.tabs.query({currentWindow: true}, showTabs);
}


function showTabs(tabs) {
  _tabs = tabs;
  _list.empty();
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    var title = t.title;
    if (!title || !/\S/.test(title)) {
      title = 'blank';
    }

    var item = $(Item(t.id, title, t.favIconUrl, t.url));
    _list.append(item);
  }

  updateLayout();
  initSortable();
  initSelectable();
  highlightActiveTab();
  enableItemClick();


  $('.close-btn').click(function() {
    // stop the event from triggering the '.item' click callback
    event.stopPropagation();

    var item = $(this).parent();
    var idx = item.index();
    closeTab(idx);
  });

  $('.select-btn').click(function() {
    _selectMode = !_selectMode;
    if (_selectMode) {
      _list.sortable('disable');
      _list.selectable('enable');
      _list.find('.check').css('display', 'block');
      _list.find('.close-btn').css('display', 'none');
      $(this).addClass('focused');
      $(this).trigger('mouseenter');
      // $('#closeAllBtnBox').css('display', 'inline-block');
      disableItemClick();
      _selected = [];
    }
    else {
      _list.sortable('enable');
      _list.selectable('disable');
      _list.find('.check').css('display', 'none');
      _list.find('.close-btn').css('display', 'block');
      $('#closeAllBtnBox').css('display', 'none');
      enableItemClick();
      $(this).removeClass('focused');
      $(this).mouseleave();

      // remove color
      _list.find('.ui-selected').removeClass('ui-selected');
    }
  });

  $('.select-btn').mouseup(function() {
    // remove focus after clicked
    $(this).blur();
  });

  $('.close-all-btn').click(function() {
    $($('.item.ui-selected').get().reverse()).each(function(idx, elem) {
      tabIdx = $(elem).index();
      closeTab(tabIdx);
      $('#closeAllBtnBox').css('display', 'none');
    });
  });

  $('.close-all-btn').mouseup(function() {
    // remove focus after clicked
    $(this).blur();
  });


  // $('.item').fn.bindFirst('mousedown', function() {
  //   event.metaKey = true;
  // });

  $('.item').mousedown(function(event) {
    item = event.currentTarget;
    event.metaKey = true;
  });
  $('.item').click(function() {
    selectStop();
  });

  // only with adding this, we can select multiple items by clicking "check"
  // or the selected items are cleared
  $('.check').mousedown(function() {
    event.stopPropagation();
  });

  $('.check').click(function() {
    var item = $(this).parent();//[0];

    if (item.hasClass('ui-selected')) {
      item.removeClass('ui-selected');
    }
    else if (!item.hasClass('unselectable')) {
      item.addClass('ui-selected');
    }

    selectStop();

    // stop the event from triggering the '.item' click callback
    event.stopPropagation();
  });
}

function updateLayout() {
  // sum the items to find proper height value for the list
  // the "invisible" (filtered by searching) items don't count
  var visibleItems = _list.find('.item[display!="none"]').toArray();
  var h = visibleItems.map((item)=> {
    return $(item).outerHeight();
  }).reduce((a,b)=>{
    return a + b;
  }, 0);

  _list.css('overflowY', 'auto');
  _list.css('max-height', Math.min(h, 550));
  _list.css('margin-bottom', '3px');
  $('html').height(_list.height() + 45);
}

function closeTab(tabIdx) {
  $('.item')[tabIdx].remove();
  chrome.tabs.remove(_tabs[tabIdx].id, function() {
    _tabs.splice(tabIdx, 1);

    updateLayout();
  });
}


function highlightActiveTab() {
  chrome.tabs.query({currentWindow:true, active: true}, function(tabs) {
    var idx = tabs[0].index;
    var item = $($('#tabs').find('.item').get(idx));
    // item.addClass('active');
    item.addClass('disabled');

    // disable click function of the item
    item.off('click');

    // disable close for current tab
    item.find('.close-btn')
        .css('pointer-events', 'none')
        .css('display', 'none');

    // disable selectable for current tab
    item.addClass("unselectable");
    item.find('.check').remove();
  });
}

function enableItemClick() {
  $('.item').click(function() {
    var idx = $(this).index();
    console.log(idx);
    jumpToTab(idx);
  });
}

function disableItemClick() {
  $('.item').off('click');
}

function jumpToTab(idx) {
  chrome.tabs.update(_tabs[idx].id, {active: true});
  window.close();
}

// make the items draggable to sort the tabs
// with jqueryui's sortable() function
function initSortable() {
  var originalIndex;;
  _list.sortable({
    start: (event, ui) => {
      originalIndex = ui.item.index();
    },
    update: (event, ui) => {
      chrome.tabs.move(_tabs[originalIndex].id, {index: ui.item.index()});
    }
  });
}

function initSelectable() {
  // insert metaKey = true to implement multiple-selection
  // https://stackoverflow.com/questions/4396042/implement-multiple-selects-with-jquery-ui-selectable
  _list.bind('mousedown', (e) => {
      e.metaKey = true;
  }).selectable({
    filter: '.item:not(.unselectable)',
    stop: selectStop
  });
  _list.selectable('disable');
}

// This is from Kilian:
//     http://kilianvalkhof.com/2010/javascript/how-to-build-a-fast-simple-list-filter-with-jquery/
function initFilter() {
  jQuery.expr[':'].Contains = function(a,i,m){
    return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
  };

  $('#searchinput').change(function() {
    var newFilter = $(this).val();
    if (newFilter == _filter) {
      // no change
      return;
    }
    _filter = newFilter;
    var duration = 0;
    if (_filter) {
      $('#searchclear').show();
      _list.find("div:not(:Contains(" + _filter + "))").parent().slideUp(duration);
      // use promise to call updateLayout() after all slides are done
      $.when(_list.find("div:Contains(" + _filter + ")").parent().slideDown(duration)).then(updateLayout);
    } else {
      $('#searchclear').hide();
      // use promise to call updateLayout() after all slides are done
      $.when(_list.find(".item").slideDown(duration)).then(updateLayout);
    }
    setFocus(0);
  }).keyup(function() {
    $(this).change();
  });

  $('#searchclear').click(function() {
    $('#searchinput').val('').focus().change();
    $(this).hide();
  });
}


function updateSelected() {
  // update selected items according to _selected
  $(".item").removeClass("ui-selected");
  _selected.map((item) => {
    $(item).addClass("ui-selected");
  });
}


function selectStop() {
  if ($('.item.ui-selected').length > 0) {
    $('#closeAllBtnBox').css('display', 'inline-block');
  }
  else {
    $('#closeAllBtnBox').css('display', 'none');
  }
}


function initFocus() {
  _focus.callback = (old, neww) => {
    // clear old focus
    if (old > 0) {
      _list.children().eq(old-1).removeClass('focused');
    }

    // set new focus
    if (neww == 0) {
      $('#searchinput').focus();
    } else if (neww > 0) {
      var item = _list.children().eq(neww-1);
      item.addClass('focused');
      if (!isItemInViewpost(item)) {
        // item[0] to get raw js element
        item[0].scrollIntoView(neww < old);
      }
    }
  }
  setFocus(0);
}

function setFocus(i) {
  if (i < 0 || (_tabs && i > _tabs.length)) {
    return;
  }
  _focus.at = i;
}

function setFocusNext(currentInd) {
  for (var i = currentInd + 1; i <= _tabs.length; i++) {
    if (_list.children().eq(i-1).is(':visible')) {
      setFocus(i);
      return;
    }
  }
}

function setFocusPrev(currentInd) {
  for (var i = currentInd - 1; i >= 0; i--) {
    if (i == 0 || _list.children().eq(i-1).is(':visible')) {
      setFocus(i);
      return;
    }
  }
}

function isItemInViewpost(item) {
  var itemTop = item.offset().top;
  var itemBottom = item.offset().top + item.outerHeight();
  var listBottom = _list.offset().top + _list.innerHeight();
  var listTop = _list.offset().top;
  return itemBottom <= listBottom && itemTop >= listTop;
}

function initArrowKeys() {

  document.addEventListener('keydown', (e) => {
    if (_selectMode) {
      return;
    }
    switch(e.key) {
      case 'ArrowUp': // up
        setFocusPrev(_focus.at);
        break;
      case 'ArrowDown': // down
        setFocusNext(_focus.at);
        break;
      case 'Enter':
        if (_focus.at > 0) {
          jumpToTab(_focus.at-1);
        }
      default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move car
  });
}

document.addEventListener('DOMContentLoaded', function () {
  _list = $('#tabs');
  queryTabs();
  initFilter();
  initFocus();
  initArrowKeys();
});