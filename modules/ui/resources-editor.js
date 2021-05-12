'use strict';
function editResources() {
  if (customization) return;
  closeDialogs('#resourcesEditor, .stable');
  if (!layerIsOn('toggleResources')) toggleResources();
  const body = document.getElementById('resourcesBody');

  resourcesEditorAddLines();

  if (modules.editResources) return;
  modules.editResources = true;

  $('#resourcesEditor').dialog({
    title: 'Resources Editor',
    resizable: false,
    width: fitContent(),
    close: closeResourcesEditor,
    position: {my: 'right top', at: 'right-10 top+10', of: 'svg'}
  });

  // add listeners
  document.getElementById('resourcesEditorRefresh').addEventListener('click', resourcesEditorAddLines);
  document.getElementById('resourcesRegenerate').addEventListener('click', regenerateResources);
  document.getElementById('resourcesLegend').addEventListener('click', toggleLegend);
  document.getElementById('resourcesPercentage').addEventListener('click', togglePercentageMode);
  document.getElementById('resourcesExport').addEventListener('click', downloadResourcesData);

  body.addEventListener('click', function (ev) {
    const el = ev.target,
      cl = el.classList,
      line = el.parentNode,
      i = +line.dataset.id;
    const resource = Resources.get(+line.dataset.id);
    if (cl.contains('resourceCategory')) return changeCategory(resource, line, el);
    if (cl.contains('resourceModel')) return changeModel(resource, line, el);
    if (cl.contains('resourceBonus')) return changeBonus(resource, line, el);
  });

  body.addEventListener('change', function (ev) {
    const el = ev.target,
      cl = el.classList,
      line = el.parentNode;
    const resource = Resources.get(+line.dataset.id);
    if (cl.contains('resourceName')) return changeName(resource, el.value, line);
    if (cl.contains('resourceValue')) return changeValue(resource, el.value, line);
    if (cl.contains('resourceChance')) return changeChance(resource, el.value, line);
  });

  function getBonusIcon(bonus) {
    if (bonus === 'fleet') return `<span data-tip="Fleet bonus" class="icon-anchor"></span>`;
    if (bonus === 'defence') return `<span data-tip="Defence bonus" class="icon-chess-rook"></span>`;
    if (bonus === 'prestige') return `<span data-tip="Prestige bonus" class="icon-star"></span>`;
    if (bonus === 'artillery') return `<span data-tip="Artillery bonus" class="icon-rocket"></span>`;
    if (bonus === 'infantry') return `<span data-tip="Infantry bonus" class="icon-pawn"></span>`;
    if (bonus === 'population') return `<span data-tip="Population bonus" class="icon-male"></span>`;
    if (bonus === 'archers') return `<span data-tip="Archers bonus" class="icon-dot-circled"></span>`;
    if (bonus === 'cavalry') return `<span data-tip="Cavalry bonus" class="icon-knight"></span>`;
  }

  // add line for each resource
  function resourcesEditorAddLines() {
    const addTitle = (string, max) => (string.length < max ? '' : `title="${string}"`);
    let lines = '';

    for (const r of pack.resources) {
      const stroke = Resources.getStroke(r.color);
      const model = r.model.replaceAll('_', ' ');
      const bonusArray = Object.entries(r.bonus).map(e => Array(e[1]).fill(e[0])).flat(); //prettier-ignore
      const bonusHTML = bonusArray.map((bonus) => getBonusIcon(bonus)).join('');
      const bonusString = Object.entries(r.bonus).map((e) => e.join(': ')).join('; '); //prettier-ignore

      lines += `<div class="states resources"
          data-id=${r.i} data-name="${r.name}" data-color="${r.color}"
          data-category="${r.category}" data-chance="${r.chance}" data-bonus="${bonusString}"
          data-value="${r.value}" data-model="${r.model}" data-cells="${r.cells}">
        <svg data-tip="Resource icon. Click to change" width="2em" height="2em" class="icon">
          <circle cx="50%" cy="50%" r="42%" fill="${r.color}" stroke="${stroke}"/>
          <use href="#${r.icon}" x="10%" y="10%" width="80%" height="80%"/>
        </svg>
        <input data-tip="Resource name. Click and category to change" class="resourceName" value="${r.name}" autocorrect="off" spellcheck="false">
        <div data-tip="Resource category. Select to change" class="resourceCategory">${r.category}</div>
        <input data-tip="Resource generation chance in eligible cell. Click and type to change" class="resourceChance" value="${r.chance}" type="number" min=0 max=100 step=.1 />
        <div data-tip="Resource spread model. Click to change" class="resourceModel" ${addTitle(model, 8)}">${model}</div>
        <div data-tip="Number of cells with resource" class="cells">${r.cells}</div>

        <input data-tip="Resource basic value. Click and type to change" class="resourceValue" value="${r.value}" type="number" min=0 max=100 step=1 />
        <div data-tip="Resource bonus. Click to change" class="resourceBonus" title="${bonusString}">${bonusHTML}</div>
        <span data-tip="Remove resource" class="icon-trash-empty hide"></span>
      </div>`;
    }
    body.innerHTML = lines;

    // update footer
    document.getElementById('resourcesNumber').innerHTML = pack.resources.length;

    // add listeners
    // body.querySelectorAll("div.resources").forEach(el => el.addEventListener("mouseenter", ev => resourceHighlightOn(ev)));
    // body.querySelectorAll("div.resources").forEach(el => el.addEventListener("mouseleave", ev => resourceHighlightOff(ev)));
    // body.querySelectorAll("div.states").forEach(el => el.addEventListener("click", selectResourceOnLineClick));
    body.querySelectorAll('svg.icon').forEach((el) => el.addEventListener('click', resourceChangeColor));

    if (body.dataset.type === 'percentage') {
      body.dataset.type = 'absolute';
      togglePercentageMode();
    }
    applySorting(resourcesHeader);
    $('#resourcesEditor').dialog({width: fitContent()});
  }

  function changeCategory(resource, line, el) {
    const categories = [...new Set(pack.resources.map((r) => r.category))].sort();
    const categoryOptions = (category) => categories.map((c) => `<option ${c === category ? 'selected' : ''} value="${c}">${c}</option>`).join('');

    alertMessage.innerHTML = `
      <div style="margin-bottom:.2em" data-tip="Select category from the list">
        <div style="display: inline-block; width: 9em">Select category:</div>
        <select style="width: 9em" id="resouceCategorySelect">${categoryOptions(line.dataset.category)}</select>
      </div>

      <div style="margin-bottom:.2em" data-tip="Type new category name">
        <div style="display: inline-block; width: 9em">Custom category:</div>
        <input style="width: 9em" id="resouceCategoryAdd" placeholder="Category name" />
      </div>
    `;

    $('#alert').dialog({
      resizable: false,
      title: 'Change category',
      buttons: {
        Cancel: function () {
          $(this).dialog('close');
        },
        Apply: function () {
          applyChanges();
          $(this).dialog('close');
        }
      }
    });

    function applyChanges() {
      const custom = document.getElementById('resouceCategoryAdd').value;
      const select = document.getElementById('resouceCategorySelect').value;
      const category = custom ? capitalize(custom) : select;
      resource.category = line.dataset.category = el.innerHTML = category;
    }
  }

  function changeModel(resource, line, el) {
    const defaultModels = Resources.defaultModels;
    const model = line.dataset.model;
    const modelOptions = Object.keys(defaultModels)
      .sort()
      .map((m) => `<option ${m === model ? 'selected' : ''} value="${m}">${m.replaceAll('_', ' ')}</option>`)
      .join('');
    const wikiURL = 'https://github.com/Azgaar/Fantasy-Map-Generator/wiki/Resources:-spread-functions';
    const onSelect = "resouceModelFunction.innerHTML = Resources.defaultModels[this.value] || ' '; resouceModelCustomName.value = ''; resouceModelCustomFunction.value = ''";

    alertMessage.innerHTML = `
      <fieldset data-tip="Select one of the predefined spread models from the list" style="border: 1px solid #999; margin-bottom: 1em">
        <legend>Predefined models</legend>
        <div style="margin-bottom:.2em">
          <div style="display: inline-block; width: 6em">Name:</div>
          <select onchange="${onSelect}" style="width: 18em" id="resouceModelSelect">
            <option value=""><i>Custom</i></option>
            ${modelOptions}
          </select>
        </div>

        <div style="margin-bottom:.2em">
          <div style="display: inline-block; width: 6em">Function:</div>
          <div id="resouceModelFunction" style="display: inline-block; width: 18em; font-family: monospace; border: 1px solid #ccc; padding: 3px; font-size: .95em;vertical-align: middle">
            ${defaultModels[model] || ' '}
          </div>
        </div>
      </fieldset>

      <fieldset data-tip="Advanced option. Define custom spread model, click on 'Help' for details" style="border: 1px solid #999">
        <legend>Custom model</legend>
        <div style="margin-bottom:.2em">
          <div style="display: inline-block; width: 6em">Name:</div>
          <input style="width: 18em" id="resouceModelCustomName" value="${resource.custom ? resource.model : ''}" />
        </div>

        <div>
          <div style="display: inline-block; width: 6em">Function:</div>
          <input style="width: 18.75em; font-family: monospace; font-size: .95em" id="resouceModelCustomFunction" spellcheck="false" value="${resource.custom || ''}"/>
        </div>
      </fieldset>

      <div id="resourceModelMessage" style="color: #b20000; margin: .4em 1em 0"></div>
    `;

    $('#alert').dialog({
      resizable: false,
      title: 'Change spread model',
      buttons: {
        Help: () => openURL(wikiURL),
        Cancel: function () {
          $(this).dialog('close');
        },
        Apply: function () {
          applyChanges(this);
        }
      }
    });

    function applyChanges(dialog) {
      const customName = document.getElementById('resouceModelCustomName').value;
      const customFn = document.getElementById('resouceModelCustomFunction').value;

      const message = document.getElementById('resourceModelMessage');
      if (customName && !customFn) return (message.innerHTML = 'Error. Custom model function is required');
      if (!customName && customFn) return (message.innerHTML = 'Error. Custom model name is required');
      message.innerHTML = '';

      if (customName && customFn) {
        try {
          const allMethods = '{' + Object.keys(Resources.methods).join(', ') + '}';
          const fn = new Function(allMethods, 'return ' + customFn);
          fn({...Resources.methods});
        } catch (err) {
          message.innerHTML = 'Error. ' + err.message || err;
          return;
        }

        resource.model = line.dataset.model = el.innerHTML = customName;
        el.setAttribute('title', customName.length > 7 ? customName : '');
        resource.custom = customFn;
        $(dialog).dialog('close');
        return;
      }

      const model = document.getElementById('resouceModelSelect').value;
      if (!model) return (message.innerHTML = 'Error. Model is not set');

      resource.model = line.dataset.model = el.innerHTML = model;
      el.setAttribute('title', model.length > 7 ? model : '');
      $(dialog).dialog('close');
    }
  }

  function changeBonus(resource, line, el) {
    const bonuses = [...new Set(pack.resources.map((r) => Object.keys(r.bonus)).flat())].sort();
    const inputs = bonuses.map(
      (bonus) => `<div style="margin-bottom:.2em">
        <div style="display: inline-block; width: 7em">${capitalize(bonus)}</div>
        <input id="resourceBonus_${bonus}" style="width: 4em" type="number" step="1" min="0" max="9" value="${resource.bonus[bonus] || 0}" />
      </div>`
    );

    alertMessage.innerHTML = inputs.join('');
    $('#alert').dialog({
      resizable: false,
      title: 'Change bonus',
      buttons: {
        Cancel: function () {
          $(this).dialog('close');
        },
        Apply: function () {
          applyChanges();
          $(this).dialog('close');
        }
      }
    });

    function applyChanges() {
      const bonusObj = {};
      bonuses.forEach((bonus) => {
        const el = document.getElementById('resourceBonus_' + bonus);
        const value = parseInt(el.value);
        if (isNaN(value) || !value) return;
        bonusObj[bonus] = value;
      });

      const bonusArray = Object.entries(bonusObj).map(e => Array(e[1]).fill(e[0])).flat(); //prettier-ignore
      const bonusHTML = bonusArray.map((bonus) => getBonusIcon(bonus)).join('');
      const bonusString = Object.entries(bonusObj).map((e) => e.join(': ')).join('; '); //prettier-ignore

      resource.bonus = bonusObj;
      el.innerHTML = bonusHTML;
      line.dataset.bonus = bonusString;
      el.setAttribute('title', bonusString);
    }
  }

  function changeName(resource, name, line) {
    resource.name = line.dataset.name = name;
  }

  function changeValue(resource, value, line) {
    resource.value = line.dataset.value = +value;
  }

  function changeChance(resource, chance, line) {
    resource.chance = line.dataset.chance = +chance;
  }

  function resourceChangeColor() {
    const circle = this.querySelector('circle');
    const resource = Resources.get(+this.parentNode.dataset.id);

    const callback = function (fill) {
      const stroke = Resources.getStroke(fill);
      circle.setAttribute('fill', fill);
      circle.setAttribute('stroke', stroke);
      resource.color = fill;
      resource.stroke = stroke;
      goods.selectAll(`circle[data-i='${resource.i}']`).attr('fill', fill).attr('stroke', stroke);
    };

    openPicker(resource.color, callback, {allowHatching: false});
  }

  function toggleLegend() {
    if (legend.selectAll('*').size()) {
      clearLegend();
      return;
    }

    const data = pack.resources
      .filter((r) => r.i && r.cells)
      .sort((a, b) => b.cells - a.cells)
      .map((r) => [r.i, r.color, r.name]);
    drawLegend('Resources', data);
  }

  function togglePercentageMode() {
    if (body.dataset.type === 'absolute') {
      body.dataset.type = 'percentage';
      const totalCells = pack.cells.resource.filter((r) => r !== 0).length;

      body.querySelectorAll(':scope > div').forEach(function (el) {
        el.querySelector('.cells').innerHTML = rn((+el.dataset.cells / totalCells) * 100) + '%';
      });
    } else {
      body.dataset.type = 'absolute';
      resourcesEditorAddLines();
    }
  }

  function downloadResourcesData() {
    let data = 'Id,Resource,Color,Category,Value,Bonus,Chance,Model,Cells\n'; // headers

    body.querySelectorAll(':scope > div').forEach(function (el) {
      data += el.dataset.id + ',';
      data += el.dataset.name + ',';
      data += el.dataset.color + ',';
      data += el.dataset.category + ',';
      data += el.dataset.value + ',';
      data += el.dataset.bonus + ',';
      data += el.dataset.chance + ',';
      data += el.dataset.model + ',';
      data += el.dataset.cells + '\n';
    });

    const name = getFileName('Resources') + '.csv';
    downloadFile(data, name);
  }

  function closeResourcesEditor() {}
}