if (isCraftingScreen()) {
    var recipes = parseRecipes();
    var inventory = parseInventory();
    addCraftingMenu(recipes, inventory);
    hideKnownRecipes();

    if (canCurrentlyAutoCraft()) {
        setTimeout(handleAutoCraft, 3000);
    }
}

function showRecipeList() {
    $('#recipe-list-body').show();
    $('#manual-crafting-body').hide();
}

function showManualCrafting() {
    $('#recipe-list-body').hide();
    $('#manual-crafting-body').show();
}

function canCurrentlyAutoCraft() {
    var count = Number(window.sessionStorage.getItem('autocraft-count'));
    var target = window.sessionStorage.getItem('autocraft-target');

    if (count <= 0 || $('form[action="' + target + '"] input[type="submit"]').length <= 0) {
        return false;
    }

    return true;
}

function handleAutoCraft() {
    var count = Number(window.sessionStorage.getItem('autocraft-count'));
    var target = window.sessionStorage.getItem('autocraft-target');

    if (!canCurrentlyAutoCraft()) {
        window.sessionStorage.removeItem('autocraft-name');
        window.sessionStorage.removeItem('autocraft-target');
        window.sessionStorage.removeItem('autocraft-count');

        return;
    }

    count--;
    window.sessionStorage.setItem('autocraft-count', count);
    $('form[action="' + target + '"] input[type="submit"]').trigger('click');
}

function isCraftingScreen() {
    return window.location.pathname == '/game/crafting';
}

function hideKnownRecipes() {
    $('.card:contains(Known recipes)').hide();
}

function getItemsCount(items) {
    var res = []
    for (var i in items) {
        var item = res.find(x => x.name == items[i]);

        if (item) {
            item.count++;
        } else {
            res.push({
                name: items[i],
                count: 1
            })
        }
    }

    return res
}

function parseRecipes() {
    var recipeListElem = $('.card:contains(Known recipes)').parent().find('.list-group');
    var recipesElems = $(recipeListElem).children();

    var recipesData = [];

    for (var i = 0; i < recipesElems.length; i++) {
        var formula = $(recipesElems[i]).clone().children().remove().end().text();
        formula = formula.replace((/  |\r\n|\n|\r/gm), ' ').trim();

        var [resourcesText, resultsText] = formula.split('make');

        var resources = getItemsCount(resourcesText.split(',').map(x => x.trim()));
        var results = getItemsCount(resultsText.split(',').map(x => x.trim()));

        var form = $(recipesElems[i]).find('form');

        if (form.length > 0) {
            form = $(form)[0].outerHTML;
        } else {
            form = null;
        }

        recipesData.push({
            resources: resources,
            results: results,
            form: form
        })
    }

    return recipesData;
}

function parseInventory() {
    var itemElems = $('#item_1').children();

    var items = {};

    for (var i = 0; i < itemElems.length; i++) {
        var [name, count] = $(itemElems[i]).text().split('(');

        name = name.trim();

        count = count.substr(0, count.length - 1);
        count = Number(count);

        items[name] = {
            count: count
        }
    }

    return items;
}

function addCraftingMenu(recipes, inventory) {
    var startCraftingHeader = jQuery('.card-header:contains(Start crafting)');
    $(startCraftingHeader).text('Manual crafting');
    $(startCraftingHeader).attr('id', 'manual-crafting-header');
    $(startCraftingHeader).css('cursor', 'pointer');

    var startCraftingBody = $(startCraftingHeader).siblings('.card-body');
    $(startCraftingBody).attr('id', 'manual-crafting-body');
    $(startCraftingBody).after('<p id="recipe-list-header" class="card-header" style="cursor: pointer">Recipe list</p>');

    var craftingBodyHtml = '<div id="recipe-list-body" class="card-body">';

    var autoCraftName = window.sessionStorage.getItem('autocraft-name');
    var autoCraftCount = Number(window.sessionStorage.getItem('autocraft-count'));

    if (canCurrentlyAutoCraft()) {
        craftingBodyHtml +=
            '<div class="d-flex align-items-baseline"><p>Currently crafting: ' +
            autoCraftName +
            ' ' +
            autoCraftCount +
            ' times</p><button id="stop-autocraft-btn" class="btn btn-primary ml-2">Stop</button></div>';
    } else {
        craftingBodyHtml += '<p>Currently crafting: nothing</p>';
    }

    for (var i in recipes) {
        craftingBodyHtml += '<div class="d-flex flex-wrap align-items-baseline" style="padding: 16px 0; border-top: 1px solid #444;"><p class="mr-2">';
        for (var j = 0; j < recipes[i].resources.length; j++) {
            craftingBodyHtml += recipes[i].resources[j].name + ' (' + inventory[recipes[i].resources[j].name].count + ')';

            if (recipes[i].resources[j].count > 1) {
                craftingBodyHtml += ' x' + recipes[i].resources[j].count;
            }

            if (j < recipes[i].resources.length - 1) {
                craftingBodyHtml += ', ';
            }
        }

        craftingBodyHtml += ' -> ';

        for (var j = 0; j < recipes[i].results.length; j++) {
            craftingBodyHtml += recipes[i].results[j].name;

            if (recipes[i].results[j].count > 1) {
                craftingBodyHtml += ' x' + recipes[i].results[j].count;
            }

            if (j < recipes[i].results.length - 1) {
                craftingBodyHtml += ', ';
            }
        }

        craftingBodyHtml += '</p>';

        if (recipes[i].form) {
            craftingBodyHtml += '<div class="d-flex flex-wrap align-items-baseline" style="flex-basis: 100%">'
            craftingBodyHtml += recipes[i].form;

            craftingBodyHtml += '<input class="autocraft-count ml-4 mr-2" type="number" min="1" max="1000000">';
            craftingBodyHtml +=
                '<button data-target-url="' +
                $(recipes[i].form).attr('action') +
                '" data-target-name="' +
                recipes[i].results.map(function (e) { return e.name }).join(', ') +
                '" class="autocraft-btn btn btn-primary">Autocraft</button></div>';
        }

        craftingBodyHtml += '</div>';
    }

    $('#recipe-list-header').after(craftingBodyHtml);

    showRecipeList();

    $('#recipe-list-header').click(showRecipeList);
    $('#manual-crafting-header').click(showManualCrafting);

    $('.autocraft-btn').click(function () {
        var target = $(this).data('target-url');
        var count = $(this).siblings('.autocraft-count').val();
        var name = $(this).data('target-name');

        if (count <= 0 || !count) {
            alert('Incorrect autocraft count set.');
            return;
        }

        window.sessionStorage.setItem('autocraft-count', Number(count));
        window.sessionStorage.setItem('autocraft-target', target);
        window.sessionStorage.setItem('autocraft-name', name);

        handleAutoCraft();
    })

    $('#stop-autocraft-btn').click(function () {
        window.sessionStorage.removeItem('autocraft-count');
        window.sessionStorage.removeItem('autocraft-target');
        window.sessionStorage.removeItem('autocraft-name');

        window.location.reload();
    })
}
