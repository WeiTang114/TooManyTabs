var _list;
var _tabs;
var _selectMode = false;
var _selected = [];
const Item = (tabid, title, favIconUrl) => `
  <a data-tabid="${tabid}" href="#" class="list-group-item item" tabindex="-1">
    <div class="fa fa-check check"></div>
    <img class="favicon" src="${favIconUrl}">
    <span class="glyphicon glyphicon-remove-circle pull-right close-btn"></span>
    <div class="text">${title}</div>
    <div class=""
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

    var item = $(Item(t.id, title, t.favIconUrl));
    _list.append(item);
  }

  updateLayout();
  highlightActiveTab();
  enableItemClick();


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

  $('.select-btn').click(function() {
    _selectMode = !_selectMode;
    if (_selectMode) {
      _list.sortable('disable');
      _list.selectable('enable');
      _list.find('.check').css('display', 'block');
      disableItemClick();
      _selected = [];
    }
    else {
      _list.sortable('enable');
      _list.selectable('disable');
      _list.find('.check').css('display', 'none');
      enableItemClick();

      // remove color
      _list.find('.ui-selected').removeClass('ui-selected');
    }
  });


  // $('.item').fn.bindFirst('mousedown', function() {
  //   event.metaKey = true;
  // });

  $('.item').mousedown(function(event) {
    console.log('item.mousedown');
    console.log(event);
    item = event.currentTarget;

    event.metaKey = true;
    // ind = _selected.indexOf(item);
    // alreadySelected = (ind >= 0);
    // if (alreadySelected) {
    //   console.log("Removing element " + ind + " from selected");
    //   _selected.splice(ind, 1);
    // }
    // else {
    //   _selected.push(item);
    // }
    // updateSelected();
  });

  // only with adding this, we can select multiple items by clicking "check"
  // or the selected items are cleared
  $('.check').mousedown(function() {
    event.stopPropagation();
  });

  $('.check').click(function() {
    var item = $(this).parent();//[0];
    console.log(item);
    if (item.hasClass('ui-selected')) {
      item.removeClass('ui-selected');
    }
    else {
      item.addClass('ui-selected');
    }

    // ind = _selected.indexOf(item);
    // alreadySelected = (ind >= 0);
    // if (alreadySelected) {
    //   console.log("Removing " + ind + " from selected");
    //   _selected.splice(ind, 1);
    // }
    // else {
    //   _selected.push(item);
    // }
    // updateSelected();


    // stop the event from triggering the '.item' click callback
    event.stopPropagation();
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

function enableItemClick() {
  $('.item').click(function() {
    var idx = $(this).index();
    console.log(idx);
    chrome.tabs.update(_tabs[idx].id, {active: true});
    window.close();
  });
}

function disableItemClick() {
  $('.item').off('click');
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
    filter: '.item',
    // selected: (e, ui) => {
    //   // if (ui.hasClass('ui-selected')) {
    //   //   ui.item.removeClass('ui-selected');
    //   // }

    //   ind = _selected.indexOf(ui.selected);
    //   alreadySelected = (ind >= 0);
    //   // console.log("SELECTED");
    //   // console.log(ui);
    //   // console.log(ui.selected);
    //   if (alreadySelected) {
    //     console.log("Removing " + ind + " from selected");
    //     _selected.splice(ind, 1);
    //   }
    //   else {
    //     elem = ui.selected;
    //     _selected.push(elem);
    //   }
    //   console.log(_selected);
    // },
    // stop: (e, ui) => {
    //   console.log("STOP");

    //   updateSelected();
    // }
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


function updateSelected() {
  // update selected items according to _selected
  $(".item").removeClass("ui-selected");
  _selected.map((item) => {
    // console.log("stop");
    // console.log(item);
    $(item).addClass("ui-selected");
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
  initSortable();
  initSelectable();
  initFilter();
  initArrowKeys();
});
