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

var API = Spark.getGameDataService();
var colPlayerAchievement = "playerAchievement";
var colPlayerItem = "playerItem";
var colPlayerStamina = "playerStamina";
var colPlayerFormation = "playerFormation";
var colPlayerUnlockItem = "playerUnlockItem";
var colPlayerClearStage = "playerClearStage";
var colPlayerBattle = "playerBattle";

function LevelUpItem(itemId, materials)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerItem,
        API.S("playerId").eq(playerId).and(API.S("id").eq(itemId)),
        API.sort("id", false));
    var result = queryResult.cursor();
    var item;
    var itemEntry;
    if (result.hasNext())
    {
        itemEntry = result.next();
        item = itemEntry.getData();
    }
    if (!item)
    {
        Spark.setScriptData("error", ERROR_INVALID_PLAYER_ITEM_DATA);
    }
    else
    {
        var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
        var levelUpPrice = CalculateItemLevelUpPrice(item);
        var requireCurrency = 0;
        var increasingExp = 0;
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var materialItems = [];
        for (var materialItemId in materials)
        {
            var findMaterialQueryResult = API.queryItems(
                colPlayerItem,
                API.S("playerId").eq(playerId).and(API.S("id").eq(materialItemId)),
                API.sort("id", false));
            var findMaterialResult = findMaterialQueryResult.cursor();
            var foundItem;
            var foundItemEntry;
            if (findMaterialResult.hasNext())
            {
                foundItemEntry = findMaterialResult.next();
                foundItem = foundItemEntry.getData();
            }
            
            if (!foundItem)
            {
                continue;
            }
    
            if (CanItemBeMaterial(foundItem))
            {
                materialItems.push(foundItem);
            }
        }
        var countMaterialItems = materialItems.length;
        for (var i = 0; i < countMaterialItems; ++i)
        {
            var materialItem = materialItems[i];
            var usingAmount = materials[materialItem.id];
            if (usingAmount > materialItem.amount)
            {
                usingAmount = materialItem.amount;
            }
            requireCurrency += levelUpPrice * usingAmount;
            increasingExp += CalculateItemRewardExp(materialItem) * usingAmount;
            materialItem.amount -= usingAmount;
            if (materialItem.amount > 0)
            {
                updateItems.push(materialItem);
            }
            else
            {
                deleteItemIds.push(materialItem.id);
            }
        }
        if (requireCurrency > player.getBalance(softCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_SOFT_CURRENCY);
        }
        else
        {
            player.debit(softCurrencyId, requireCurrency, "Level up item [" + itemId + "]");
            item.exp += increasingExp;
            updateItems.push(item);
            var countUpdateItems = updateItems.length;
            for (var i = 0; i < countUpdateItems; ++i)
            {
                var updateItem = updateItems[i];
                var doc = API.getItem(colPlayerItem, updateItem.id).document();
                if (doc)
                {
                    doc.setData(updateItem);
                    doc.persistor().persist().error();
                }
            }
            var countDeleteItemIds = deleteItemIds.length;
            for (var i = 0; i < countDeleteItemIds; ++i)
            {
                var deleteItemId = deleteItemIds[i];
                var doc = API.getItem(colPlayerItem, deleteItemId).document();
                if (doc)
                {
                    doc.delete();
                }
            }
            var softCurrency = GetCurrency(playerId, softCurrencyId);
            updateCurrencies.push(softCurrency);
            // Update achievement
            var itemData = gameDatabase.items[item.dataId];
            if (itemData)
            {
                if (itemData.type == "CharacterItem") {
                    QueryUpdateAchievement(UpdateCountLevelUpCharacter(playerId, GetAchievementListInternal(playerId)));
                }
                if (itemData.type == "EquipmentItem") {
                    QueryUpdateAchievement(UpdateCountLevelUpEquipment(playerId, GetAchievementListInternal(playerId)));
                }
            }
            // Set API result
            Spark.setScriptData("updateItems", updateItems);
            Spark.setScriptData("deleteItemIds", deleteItemIds);
            Spark.setScriptData("updateCurrencies", updateCurrencies);
        }
    }
}

function EvolveItem(itemId, materials)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var queryResult = API.queryItems(
        colPlayerItem,
        API.S("playerId").eq(playerId).and(API.S("id").eq(itemId)),
        API.sort("id", false));
    var result = queryResult.cursor();
    var item;
    var itemEntry;
    if (result.hasNext())
    {
        itemEntry = result.next();
        item = itemEntry.getData();
    }
    if (!item)
    {
        Spark.setScriptData("error", ERROR_INVALID_PLAYER_ITEM_DATA);
    }
    else
    {
        var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
        var requireCurrency = CalculateItemEvolvePrice(item);
        var enoughMaterials = true;
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var materialItems = [];
        var requiredMaterials = GetItemEvolveMaterials(item);   // This is Key-Value Pair for `playerItem.DataId`, `Required Amount`
        for (var materialItemId in materials)
        {
            var findMaterialQueryResult = API.queryItems(
                colPlayerItem,
                API.S("playerId").eq(playerId).and(API.S("id").eq(materialItemId)),
                API.sort("id", false));
            var findMaterialResult = findMaterialQueryResult.cursor();
            var foundItem;
            var foundItemEntry;
            if (findMaterialResult.hasNext())
            {
                foundItemEntry = findMaterialResult.next();
                foundItem = foundItemEntry.getData();
            }
            
            if (!foundItem)
            {
                continue;
            }
    
            if (CanItemBeMaterial(foundItem))
            {
                materialItems.push(foundItem);
            }
        }
        var countRequiredMaterials = requiredMaterials.length;
        for (var i = 0; i < countRequiredMaterials; ++i)
        {
            var requiredMaterial = requiredMaterials[i];
            var dataId = requiredMaterial.id;
            var amount = requiredMaterial.amount;
            var countMaterialItems = materialItems.length;
            for (var j = 0; j < countMaterialItems; ++j)
            {
                var materialItem = materialItems[j];
                if (materialItem.dataId !== dataId)
                {
                    continue;
                }
                
                var usingAmount = materials[materialItem.id];
                if (usingAmount > materialItem.amount)
                {
                    usingAmount = materialItem.amount;
                }
                if (usingAmount > amount)
                {
                    usingAmount = amount;
                }
                materialItem.amount -= usingAmount;
                amount -= usingAmount;
                if (materialItem.amount > 0)
                {
                    updateItems.push(materialItem);
                }
                else
                {
                    deleteItemIds.push(materialItem.id);
                }
                if (amount == 0)
                {
                    break;
                }
            }
            if (amount > 0)
            {
                enoughMaterials = false;
                break;
            }
        }
        
        if (requireCurrency > player.getBalance(softCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_SOFT_CURRENCY);
        }
        else if (!enoughMaterials)
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_ITEMS);
        }
        else
        {
            player.debit(softCurrencyId, requireCurrency, "Evolve item [" + itemId + "]");
            item = GetItemEvolve(item);
            updateItems.push(item);
            var countUpdateItems = updateItems.length;
            for (var i = 0; i < countUpdateItems; ++i)
            {
                var updateItem = updateItems[i];
                var doc = API.getItem(colPlayerItem, updateItem.id).document();
                if (doc)
                {
                    doc.setData(updateItem);
                    doc.persistor().persist().error();
                }
            }
            var countDeleteItemIds = deleteItemIds.length;
            for (var i = 0; i < countDeleteItemIds; ++i)
            {
                var deleteItemId = deleteItemIds[i];
                var doc = API.getItem(colPlayerItem, deleteItemId).document();
                if (doc)
                {
                    doc.delete();
                }
            }
            var softCurrency = GetCurrency(playerId, softCurrencyId);
            updateCurrencies.push(softCurrency);
            // Update achievement
            var itemData = gameDatabase.items[item.dataId];
            if (itemData)
            {
                if (itemData.type == "CharacterItem") {
                    QueryUpdateAchievement(UpdateCountEvolveCharacter(playerId, GetAchievementListInternal(playerId)));
                }
                if (itemData.type == "EquipmentItem") {
                    QueryUpdateAchievement(UpdateCountEvolveEquipment(playerId, GetAchievementListInternal(playerId)));
                }
            }
            // Set API result
            Spark.setScriptData("updateItems", updateItems);
            Spark.setScriptData("deleteItemIds", deleteItemIds);
            Spark.setScriptData("updateCurrencies", updateCurrencies);
        }
    }
}

function SellItems(items)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
    var returnCurrency = 0;
    var updateItems = [];
    var deleteItemIds = [];
    var updateCurrencies = [];
    var sellingItems = [];
    
    for (var sellingItemId in items)
    {
        var findSellingItemQueryResult = API.queryItems(
            colPlayerItem,
            API.S("playerId").eq(playerId).and(API.S("id").eq(sellingItemId)),
            API.sort("id", false));
        var findSellingItemResult = findSellingItemQueryResult.cursor();
        var foundItem;
        var foundItemEntry;
        if (findSellingItemResult.hasNext())
        {
            foundItemEntry = findSellingItemResult.next();
            foundItem = foundItemEntry.getData();
        }
        
        if (!foundItem)
        {
            continue;
        }

        if (CanSellItem(foundItem))
        {
            sellingItems.push(foundItem);
        }
    }
    var countSellingItems = sellingItems.length;
    for (var i = 0; i < countSellingItems; ++i)
    {
        var sellingItem = sellingItems[i];
        var usingAmount = items[sellingItem.id];
        if (usingAmount > sellingItem.amount)
        {
            usingAmount = sellingItem.amount;
        }
        returnCurrency += CalculateItemSellPrice(sellingItem) * usingAmount;
        sellingItem.amount -= usingAmount;
        if (sellingItem.amount > 0)
        {
            updateItems.push(sellingItem);
        }
        else
        {
            deleteItemIds.push(sellingItem.id);
        }
    }
    player.credit(softCurrencyId, returnCurrency, "Sell Items");
    var countUpdateItems = updateItems.length;
    for (var i = 0; i < countUpdateItems; ++i)
    {
        var updateItem = updateItems[i];
        var doc = API.getItem(colPlayerItem, updateItem.id).document();
        if (doc)
        {
            doc.setData(updateItem);
            doc.persistor().persist().error();
        }
    }
    var countDeleteItemIds = deleteItemIds.length;
    for (var i = 0; i < countDeleteItemIds; ++i)
    {
        var deleteItemId = deleteItemIds[i];
        var doc = API.getItem(colPlayerItem, deleteItemId).document();
        if (doc)
        {
            doc.delete();
        }
    }
    var softCurrency = GetCurrency(playerId, softCurrencyId);
    updateCurrencies.push(softCurrency);
    Spark.setScriptData("updateItems", updateItems);
    Spark.setScriptData("deleteItemIds", deleteItemIds);
    Spark.setScriptData("updateCurrencies", updateCurrencies);
}

function EquipItem(characterId, equipmentId, equipPosition)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var character;
    var equipment;
    var characterEntry = API.getItem(colPlayerItem, characterId).document();
    var equipmentEntry = API.getItem(colPlayerItem, equipmentId).document();
    if (characterEntry)
        character = characterEntry.getData();
    if (equipmentEntry)
        equipment = equipmentEntry.getData();
    if (!character || !equipment || character.playerId !== playerId || equipment.playerId !== playerId)
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
        else if (equipmentData.equippablePositions && 
            equipmentData.equippablePositions.length > 0 && 
            equipmentData.equippablePositions.indexOf(equipPosition) === -1)
        {
            Spark.setScriptData("error", ERROR_INVALID_EQUIP_POSITION);
        }
        else
        {
            var updateItems = [];
            var unEquipItemQueryResult = API.queryItems(
                colPlayerItem,
                API.S("playerId").eq(playerId));
            var unEquipItemCursor = unEquipItemQueryResult.cursor();
            while (unEquipItemCursor.hasNext())
            {
                var unEquipItemDoc = unEquipItemCursor.next();
                var unEquipItem = unEquipItemDoc.getData();
                if (unEquipItem.equipItemId == characterId && unEquipItem.equipPosition == equipPosition)
                {
                    unEquipItem.equipItemId = "";
                    unEquipItem.equipPosition = "";
                    unEquipItemDoc.setData(unEquipItem);
                    unEquipItemDoc.persistor().persist().error();
                    updateItems.push(unEquipItem);
                }
            }
            equipment.equipItemId = characterId;
            equipment.equipPosition = equipPosition;
            var equipItemDoc = API.getItem(colPlayerItem, equipment.id).document();
            if (equipItemDoc)
            {
                equipItemDoc.setData(equipment);
                equipItemDoc.persistor().persist().error();
            }
            updateItems.push(equipment);
            Spark.setScriptData("updateItems", updateItems);
        }
    }
}

function UnEquipItem(equipmentId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var unEquipItemDoc = API.getItem(colPlayerItem, equipmentId).document();
    var unEquipItem;
    if (unEquipItemDoc)
    {
        unEquipItem = unEquipItemDoc.getData();
    }
    if (!unEquipItem || unEquipItem.playerId != playerId)
    {
        Spark.setScriptData("error", ERROR_INVALID_PLAYER_ITEM_DATA);
    }
    else
    {
        var updateItems = [];
        unEquipItem.equipItemId = "";
        unEquipItem.equipPosition = "";
        unEquipItemDoc.setData(unEquipItem);
        unEquipItemDoc.persistor().persist().error();
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

function GetAvailableIapPackageList()
{
    var list = [];
    for (var key in gameDatabase.iapPackages)
    {
        list.push(key);
    }
    Spark.setScriptData("list", list);
}

function GetAvailableInGamePackageList()
{
    var list = [];
    for (var key in gameDatabase.inGamePackages)
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
        var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
        var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
        var rewardItems = [];
        var createItems = [];
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
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
                {
                    continue;
                }
                    
                var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                if (addItemsResult.success)
                {
                    var newRewardEntry = {
                        playerId : playerId,
                        dataId : rewardItem.id,
                        amount : rewardItem.amount
                    };
                    rewardItems.push(newRewardEntry);

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
                        var updateItem = addItemsResult.updateItems[j];
                        var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                        var updateItemEntry = updateItemResult.document();
                        updateItemEntry.setData(updateItem);
                        updateItemEntry.persistor().persist().error();
                        updateItems.push(updateItem);
                    }
                }
                // End add item condition
            }
            // End reward items loop
        }
        Spark.setScriptData("rewardItems", rewardItems);
        Spark.setScriptData("createItems", createItems);
        Spark.setScriptData("updateItems", updateItems);
        Spark.setScriptData("deleteItemIds", deleteItemIds);
        Spark.setScriptData("updateCurrencies", updateCurrencies);
    }
}

function OpenInGamePackage(inGamePackageDataId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var inGamePackage = gameDatabase.inGamePackages[inGamePackageDataId];
    if (!inGamePackage)
    {
        Spark.setScriptData("error", ERROR_INVALID_IN_GAME_PACKAGE_DATA);
    }
    else
    {
        var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
        var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
        var rewardItems = [];
        var createItems = [];
        var updateItems = [];
        var deleteItemIds = [];
        var updateCurrencies = [];
        var requirementType = inGamePackage.requirementType;
        var price = inGamePackage.price;
        var rewardSoftCurrency = inGamePackage.rewardSoftCurrency;
        var rewardHardCurrency = inGamePackage.rewardHardCurrency;
        if (requirementType == ENUM_IN_GAME_PACKAGE_REQUIREMENT_TYPE_SOFT_CURRENCY && price > player.getBalance(softCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_SOFT_CURRENCY);
        }
        else if (requirementType == ENUM_IN_GAME_PACKAGE_REQUIREMENT_TYPE_HARD_CURRENCY && price > player.getBalance(hardCurrencyId))
        {
            Spark.setScriptData("error", ERROR_NOT_ENOUGH_HARD_CURRENCY);
        }
        else
        {
            switch (requirementType)
            {
                case ENUM_IN_GAME_PACKAGE_REQUIREMENT_TYPE_SOFT_CURRENCY:
                    player.debit(softCurrencyId, price, "Open In-Game Package [" + inGamePackageDataId + ", " + packIndex + "]");
                    break;
                case ENUM_IN_GAME_PACKAGE_REQUIREMENT_TYPE_HARD_CURRENCY:
                    player.debit(hardCurrencyId, price, "Open In-Game Package [" + inGamePackageDataId + ", " + packIndex + "]");
                    break;
            }

            // Increase soft currency
            player.credit(softCurrencyId, rewardSoftCurrency, "Open In-Game Package - Soft Currency Reward [" + inGamePackageDataId + ", " + packIndex + "]");
            var softCurrency = GetCurrency(playerId, softCurrencyId);
            updateCurrencies.push(softCurrency);
            // Increase hard currency
            player.credit(hardCurrencyId, rewardHardCurrency, "Open In-Game Package - Hard Currency Reward [" + inGamePackageDataId + ", " + packIndex + "]");
            var hardCurrency = GetCurrency(playerId, hardCurrencyId);
            updateCurrencies.push(hardCurrency);
            
            var rewardItems = inGamePackage.rewardItems;
            for (var i = 0; i < rewardItems.length; ++i)
            {
                var rewardItem = rewardItems[i];
                if (!rewardItem)
                {
                    continue;
                }
                    
                var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                if (addItemsResult.success)
                {
                    var newRewardEntry = {
                        playerId : playerId,
                        dataId : rewardItem.id,
                        amount : rewardItem.amount
                    };
                    rewardItems.push(newRewardEntry);

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
                        var updateItem = addItemsResult.updateItems[j];
                        var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                        var updateItemEntry = updateItemResult.document();
                        updateItemEntry.setData(updateItem);
                        updateItemEntry.persistor().persist().error();
                        updateItems.push(updateItem);
                    }
                }
                // End add item condition
            }
            // End reward items loop
        }
        Spark.setScriptData("rewardItems", rewardItems);
        Spark.setScriptData("rewardSoftCurrency", rewardSoftCurrency);
        Spark.setScriptData("rewardHardCurrency", rewardHardCurrency);
        Spark.setScriptData("createItems", createItems);
        Spark.setScriptData("updateItems", updateItems);
        Spark.setScriptData("deleteItemIds", deleteItemIds);
        Spark.setScriptData("updateCurrencies", updateCurrencies);
    }
}

function EarnAchievementReward(achievementId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var achievement = gameDatabase.achievements[achievementId];
    if (!achievement)
    {
        Spark.setScriptData("error", ERROR_INVALID_ACHIEVEMENT_DATA);
    }
    else
    {
        var updateAchievementResult = API.getItem(colPlayerAchievement, GeneratePlayerAchievementId(playerId, achievementId));
        var updateAchievementEntry = updateAchievementResult.document();
        if (!updateAchievementEntry)
        {
            Spark.setScriptData("error", ERROR_ACHIEVEMENT_UNDONE);
        }
        else
        {
            var playerAchievement = updateAchievementEntry.getData();
            if (playerAchievement.earned)
            {
                Spark.setScriptData("error", ERROR_ACHIEVEMENT_EARNED);
            }
            else if (playerAchievement.progress < achievement.targetAmount)
            {
                Spark.setScriptData("error", ERROR_ACHIEVEMENT_UNDONE);
            }
            else
            {
                playerAchievement.earned = true;
                updateAchievementEntry.setData(playerAchievement);
                updateAchievementEntry.persistor().persist().error();

                var updateCurrencies = [];
                var createItems = [];
                var updateItems = [];
                var deleteItemIds = [];
                var rewardPlayerExp = achievement.rewardPlayerExp;
                var rewardSoftCurrency = achievement.rewardSoftCurrency;
                var rewardHardCurrency = achievement.rewardHardCurrency;
                var rewardItems = [];
                // Player exp
                var playerExp = player.getScriptData("exp");
                playerExp += rewardPlayerExp;
                player.setScriptData("exp", playerExp);
                // Soft currency
                player.credit(gameDatabase.currencies.SOFT_CURRENCY, rewardSoftCurrency, "Earn achievement [" + achievement.id + "]");
                var softCurrency = GetCurrency(playerId, gameDatabase.currencies.SOFT_CURRENCY);
                updateCurrencies.push(softCurrency);
                // Hard currency
                player.credit(gameDatabase.currencies.HARD_CURRENCY, rewardHardCurrency, "Earn achievement [" + achievement.id + "]");
                var hardCurrency = GetCurrency(playerId, gameDatabase.currencies.HARD_CURRENCY);
                updateCurrencies.push(hardCurrency);
                // Items
                var countRewardItems = achievement.rewardItems.length;
                for (var i = 0; i < countRewardItems; ++i)
                {
                    var rewardItem = achievement.rewardItems[i];
                    if (!rewardItem || !rewardItem.id)
                    {
                        continue;
                    }
                        
                    var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
                    if (addItemsResult.success)
                    {
                        var newRewardEntry = {
                            playerId : playerId,
                            dataId : rewardItem.id,
                            amount : rewardItem.amount
                        };
                        rewardItems.push(newRewardEntry);

                        var countCreateItems = addItemsResult.createItems.length;
                        var countUpdateItems = addItemsResult.updateItems.length;
                        for (var j = 0; j < countCreateItems; ++j)
                        {
                            var createItem = addItemsResult.createItems[j];
                            var newItemId = createItem.id;
                            var newItemEntry = API.createItem(colPlayerItem, newItemId);
                            newItemEntry.setData(createItem);
                            newItemEntry.persistor().persist().error();
                            HelperUnlockItem(playerId, createItem.dataId);
                            createItems.push(createItem);
                        }
                        for (var j = 0; j < countUpdateItems; ++j)
                        {
                            var updateItem = addItemsResult.updateItems[j];
                            var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                            var updateItemEntry = updateItemResult.document();
                            updateItemEntry.setData(updateItem);
                            updateItemEntry.persistor().persist().error();
                            updateItems.push(updateItem);
                        }
                    }
                    // End add item condition
                }
                // End reward items loop

                Spark.setScriptData("rewardPlayerExp", rewardPlayerExp);
                Spark.setScriptData("rewardSoftCurrency", rewardSoftCurrency);
                Spark.setScriptData("rewardHardCurrency", rewardHardCurrency);
                Spark.setScriptData("rewardItems", rewardItems);
                Spark.setScriptData("createItems", createItems);
                Spark.setScriptData("updateItems", updateItems);
                Spark.setScriptData("deleteItemIds", deleteItemIds);
                Spark.setScriptData("updateCurrencies", updateCurrencies);
                Spark.setScriptData("player", GetPlayer(playerId));
            }
        }
    }
}

function ConvertHardCurrency(requireHardCurrency)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var softCurrencyId = gameDatabase.currencies.SOFT_CURRENCY;
    var hardCurrencyId = gameDatabase.currencies.HARD_CURRENCY;
    if (requireHardCurrency > player.getBalance(hardCurrencyId))
    {
        Spark.setScriptData("error", ERROR_NOT_ENOUGH_HARD_CURRENCY);
    }
    else
    {
        var updateCurrencies = [];

        player.debit(hardCurrencyId, requireHardCurrency, "Convert hard currency: " + requireHardCurrency);
        var hardCurrency = GetCurrency(playerId, hardCurrencyId);
        updateCurrencies.push(hardCurrency);

        var receiveSoftCurrency = gameDatabase.hardToSoftCurrencyConversion * requireHardCurrency;

        player.credit(softCurrencyId, receiveSoftCurrency, "Convert hard currency: " + requireHardCurrency + " Receives: " + receiveSoftCurrency);
        var softCurrency = GetCurrency(playerId, softCurrencyId);
        updateCurrencies.push(softCurrency);
        
        Spark.setScriptData("updateCurrencies", updateCurrencies);
        Spark.setScriptData("requireHardCurrency", requireHardCurrency);
        Spark.setScriptData("receiveSoftCurrency", receiveSoftCurrency);
    }
}