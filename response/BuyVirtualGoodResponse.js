// ====================================================================================================
//
// Cloud Code for AuthenticationResponse, write your code here to customize the GameSparks platform.
//
// For details of the GameSparks Cloud Code API see https://docs.gamesparks.com/
//
// ====================================================================================================
// MIT License
// Copyright (c) 2018 Ittipon Teerapruettikulchai
// ====================================================================================================
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// ====================================================================================================
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
// ====================================================================================================
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
// ====================================================================================================

require("GAME_DATA_ENUM");
require("GAME_DATA");
require("HELPERS");

var API = Spark.getGameDataService();
var player = Spark.getPlayer();
var playerId = player.getPlayerId();
var gsData = Spark.getData();
var boughtItems = gsData.boughtItems;
    
// Reward result
var allRewardItems = [];
var createItems = [];
var updateItems = [];
var deleteItemIds = [];
var updateCurrencies = [];

var boughtItemsCount = boughtItems.length;
for (var boughtItemCounter = 0; boughtItemCounter < boughtItemsCount; ++boughtItemCounter)
{
    var boughtItem = boughtItems[boughtItemCounter];
    var iapPackageId = boughtItem.shortCode;
    var boughtQuantity = boughtItem.quantity;
    var iapPackage = gameDatabase.iapPackages[iapPackageId];
    if (!iapPackage)
    {
        continue;
    }
    
    for (var boughtQuantityCounter = 0; boughtQuantityCounter < boughtQuantity; ++boughtQuantityCounter)
    {
        // Reward data
        var rewardSoftCurrency = iapPackage.rewardSoftCurrency;
        var rewardHardCurrency = iapPackage.rewardHardCurrency;
        var rewardItems = iapPackage.rewardItems;
        
        // Soft currency
        player.credit(gameDatabase.currencies.SOFT_CURRENCY, rewardSoftCurrency, "IAP Bought [" + iapPackageId + "]");
        var softCurrency = GetCurrency(playerId, gameDatabase.currencies.SOFT_CURRENCY);
        updateCurrencies.push(softCurrency);
        
        // Hard currency
        player.credit(gameDatabase.currencies.HARD_CURRENCY, rewardHardCurrency, "IAP Bought [" + iapPackageId + "]");
        var hardCurrency = GetCurrency(playerId, gameDatabase.currencies.HARD_CURRENCY);
        updateCurrencies.push(hardCurrency);
        
        var countRewardItems = rewardItems.length;
        for (var i = 0; i < countRewardItems; ++i)
        {
            var rewardItem = rewardItems[i];
            if (!rewardItem)
            {
                continue;
            }

            allRewardItems.push(rewardItem);
            var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
            if (addItemsResult.success)
            {
                var countCreateItems = addItemsResult.createItems.length;
                var countUpdateItems = addItemsResult.updateItems.length;
                for (var j = 0; j < countCreateItems; ++j)
                {
                    var createItem = addItemsResult.createItems[j];
                    var newItemEntry = API.createItem(colPlayerItem, createItem.id);
                    newItemEntry.setData(createItem);
                    newItemEntry.persistor().persist().error();
                    HelperUnlockItem(playerId, createItem.dataId);
                    createItems.push(createItem);
                }
                for (var j = 0; j < countUpdateItems; ++j)
                {
                    var updateItem = addItemsResult.updateItem[j];
                    var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                    var updateItemEntry = updateItemResult.document();
                    updateItemEntry.setData(updateItem);
                    updateItemEntry.persistor().persist().error();
                    updateItems.push(updateItem);
                }
            }
        } // End add item loop
    } // Bought quantity loop
}
// Set data which will be sent to clients
Spark.setScriptData("rewardItems", allRewardItems);
Spark.setScriptData("createItems", createItems);
Spark.setScriptData("updateItems", updateItems);
Spark.setScriptData("deleteItemIds", deleteItemIds);
Spark.setScriptData("updateCurrencies", updateCurrencies);
Spark.setScriptData("player", GetPlayer(playerId));