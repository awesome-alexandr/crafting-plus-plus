$(document).ready(function () {
    if (!isCraftingScreen) {
        return;
    }

    var recipes = parseRecipes();
    var inventory = parseInventory();

    addCraftingMenu(recipes, inventory);
    hideKnownRecipes();

    function isCraftingScreen() {
        return window.location.pathname == '/game/crafting';
    }

    function hideKnownRecipes() {
        $('.card:contains(Known recipes)').hide();
    }

    function parseRecipes() {
        var recipeListElem = $('.card:contains(Known recipes)').parent().find('.list-group');
        var recipesElems = $(recipeListElem).children();

        var recipesData = [];

        for (var i = 0; i < recipesElems.length; i++) {
            var formula = $(recipesElems[i]).clone().children().remove().end().text();
            formula = formula.replace((/  |\r\n|\n|\r/gm), ' ').trim();

            var [resourcesText, resultsText] = formula.split('make');

            var resources = resourcesText.split(',').map(x => x.trim());
            var results = resultsText.split(',').map(x => x.trim());

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

        console.log(items);
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

        for (var i in recipes) {
            craftingBodyHtml += '<div class="d-flex align-items-baseline"><p class="mr-2">';
            for (var j = 0; j < recipes[i].resources.length; j++) {
                craftingBodyHtml += recipes[i].resources[j] + ' (' + inventory[recipes[i].resources[j]].count + ')';

                if (j < recipes[i].resources.length - 1) {
                    craftingBodyHtml += ', ';
                }
            }

            craftingBodyHtml += ' -> ';


            for (var j = 0; j < recipes[i].results.length; j++) {
                craftingBodyHtml += recipes[i].results[j];

                if (j < recipes[i].results.length - 1) {
                    craftingBodyHtml += ', ';
                }
            }

            craftingBodyHtml += '</p>';

            if (recipes[i].form) {
                craftingBodyHtml += recipes[i].form;
            }

            craftingBodyHtml += '</div>';
        }

        $('#recipe-list-header').after(craftingBodyHtml);

        $('#manual-crafting-body').hide();

        $('#recipe-list-header').click(function () {
            $('#recipe-list-body').show();
            $('#manual-crafting-body').hide();
        })

        $('#manual-crafting-header').click(function () {
            $('#recipe-list-body').hide();
            $('#manual-crafting-body').show();
        })
    }
})