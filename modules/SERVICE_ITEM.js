// ====================================================================================================
//
// Cloud Code for SERVICE_ITEM, write your code here to customize the GameSparks platform.
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

var colPlayerItem = Spark.runtimeCollection("playerItem");
var colPlayerStamina = Spark.runtimeCollection("playerStamina");
var colPlayerFormation = Spark.runtimeCollection("playerFormation");
var colPlayerUnlockItem = Spark.runtimeCollection("playerUnlockItem");
var colPlayerClearStage = Spark.runtimeCollection("playerClearStage");
var colPlayerBattle = Spark.runtimeCollection("playerBattle");

function LevelUpItem(itemId, materials)
{
    
}

function EvolveItem(itemId, materials)
{
    
}

function SellItems(items)
{
    
}

function EquipItem(characterId, equipmentId, equipPosition)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var character = colPlayerItem.findOne({ "_id" : { $oid: characterId }, "playerId" : playerId });
    var equipment = colPlayerItem.findOne({ "_id" : { $oid: equipmentId }, "playerId" : playerId });
    if (!character || !equipment)
    {
        Spark.setScriptData("error", ERROR_INVALID_PLAYER_ITEM_DATA);
    }
    else
    {
        var equipmentData = gameDatabase.items[equipment.dataId];
        if (!equipmentData)
        {
            Spark.setScriptData("error", ERROR_INVALID_ITEM_DATA);
        }
        else if (!equipmentData.equippablePositions || equippablePositions.indexOf(equipPosition) === -1)
        {
            Spark.setScriptData("error", ERROR_INVALID_EQUIP_POSITION);
        }
        else
        {
            var updateItems = [];
            var unEquipItem = colPlayerItem.findOne({ "equipItemId" : characterId, "equipPosition" : equipPosition, "playerId" : playerId });
            if (unEquipItem)
            {
                unEquipItem.equipItemId = "";
                unEquipItem.equipPosition = "";
                colPlayerItem.update({ "_id" : unEquipItem._id }, unEquipItem);
                updateItems.push(unEquipItem);
            }
            equipment.equipItemId = characterId;
            equipment.equipPosition = equipPosition;
            colPlayerItem.update({ "_id" : equipment._id }, equipment);
            updateItems.push(equipment);
            Spark.setScriptData("updateItems", updateItems);
        }
    }
}

function UnEquipItem(equipmentId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var unEquipItem = colPlayerItem.findOne({ "_id" : { $oid: equipmentId }, "playerId" : playerId });
    if (!unEquipItem)
    {
        Spark.setScriptData("error", ERROR_INVALID_PLAYER_ITEM_DATA);
    }
    else
    {
        var updateItems = [];
        unEquipItem.equipItemId = "";
        unEquipItem.equipPosition = "";
        colPlayerItem.update({ "_id" : unEquipItem._id }, unEquipItem);
        unEquipItem.id = unEquipItem._id.$oid;
        updateItems.push(unEquipItem);
        Spark.setScriptData("updateItems", updateItems);
    }
}

function GetAvailableLootBoxList()
{
    var list = [];
    for (var key in gameDatabase.lootBoxes)
    {
        list.push(key);
    }
    Spark.setScriptData("list", list);
}

function OpenLootBox(lootBoxDataId, packIndex)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var lootBox = gameDatabase.lootBoxes[lootBoxDataId];
    if (!lootBox)
    {
        Spark.setScriptData("error", ERROR_INVALID_LOOT_BOX_DATA);
    }
    else
    {
        var createItems = [];
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
        var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
        var requirementType = lootBox.requirementType;
        if (packIndex > lootBox.lootboxPacks.length - 1)
            packIndex = 0;
        var pack = lootBox.lootboxPacks[packIndex];
        var price = pack.price;
        var openAmount = pack.openAmount;
        if (requirementType == ENUM_LOOTBOX_REQUIREMENT_TYPE_SOFT_CURRENCY && price > player.getBalance(softCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_SOFT_CURRENCY);
        }
        else if (requirementType == ENUM_LOOTBOX_REQUIREMENT_TYPE_HARD_CURRENCY && price > player.getBalance(hardCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_HARD_CURRENCY);
        }
        else
        {
            switch (requirementType)
            {
                case ENUM_LOOTBOX_REQUIREMENT_TYPE_SOFT_CURRENCY:
                    player.debit(softCurrencyId, price, "Open Loot Box [" + lootBoxDataId + ", " + packIndex + "]");
                    var softCurrency = GetCurrency(playerId, softCurrencyId);
                    updateCurrencies.push(softCurrency);
                    break;
                case ENUM_LOOTBOX_REQUIREMENT_TYPE_HARD_CURRENCY:
                    player.debit(hardCurrencyId, price, "Open Loot Box [" + lootBoxDataId + ", " + packIndex + "]");
                    var hardCurrency = GetCurrency(playerId, hardCurrencyId);
                    updateCurrencies.push(hardCurrency);
                    break;
            }
            
            for (var i = 0; i < openAmount; ++i)
            {
                var rewardItem = RandomLootBoxReward(lootBox);
                if (!rewardItem)
                    continue;
                    
                var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                if (addItemsResult.success)
                {
                    var countCreateItems = addItemsResult.createItems.length;
                    var countUpdateItems = addItemsResult.updateItems.length;
                    for (var j = 0; j < countCreateItems; ++j)
                    {
                        var createItem = addItemsResult.createItems[j];
                        colPlayerItem.insert(createItem);
                        HelperUnlockItem(playerId, createItem.id);
                        createItem.id = createItem._id.$oid;
                        createItems.push(createItem);
                    }
                    for (var j = 0; j < countUpdateItems; ++j)
                    {
                        var updateItem = addItemsResult.updateItem[j];
                        colPlayerItem.update({ "_id" : updateItem._id }, updateItem);
                        updateItem.id = updateItem._id.$oid;
                        updateItems.push(updateItem);
                    }
                }
                // End add item condition
            }
            // End reward items loop
        }
        Spark.setScriptData("createItems", createItems);
        Spark.setScriptData("updateItems", updateItems);
        Spark.setScriptData("deleteItemIds", deleteItemIds);
        Spark.setScriptData("updateCurrencies", updateCurrencies);
    }
}
