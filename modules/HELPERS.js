// ====================================================================================================
//
// Cloud Code for HELPERS, write your code here to customize the GameSparks platform.
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
var colPlayer = "player";


function GetTimestamp()
{
    return Math.round((new Date()).getTime() / 1000);
}

function GenerateUUID()
{
    var d = new Date().getTime();
    var uuid = 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

function ShuffleArray(array)
{
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function RandomRange(min, max)
{
    return Math.random() * (max - min) + min;
}

function WeightedRandom(weights, noResultWeight)
{
    // Usage example: WeightedRandom({"a":0.5,"b":0.3,"c":0.2}); //Have chance to receives a = 50%, b = 30%, c = 20%
    
    if (!noResultWeight)
        noResultWeight = 0;
        
    var keys = [];
    var sum = 0;
    for (var key in weights)
    {
        var weight = weights[key];
        sum += weight;
        keys.push(key);
    }
    
    if (keys.length === 0)
        return undefined;
    
    var roll = RandomRange(0, sum + noResultWeight)
    var selected = keys[keys.length - 1];
    for (var key in weights)
    {
        var weight = weights[key];
        if (roll < weight)
        {
            selected = key;
            break;
        }
        roll -= weight;
    }
    
    return selected;
}

function RandomLootBoxReward(lootBox)
{
    var lootboxRewards = lootBox.lootboxRewards;
    var generatedResult = {};
    var generatedWeight = {};
    var countLootboxRewards = lootboxRewards.length;
    for (var i = 0; i < countLootboxRewards; ++i)
    {
        var lootboxReward = lootboxRewards[i];
        var id = "_" + i;
        generatedResult[id] = lootboxReward;
        generatedWeight[id] = lootboxReward.randomWeight;
    }
    
    var takenId = WeightedRandom(generatedWeight, 0);
    if (takenId)
    {
        return generatedResult[takenId];
    }
    return undefined;
}

function CalculateIntAttribute(currentLevel, maxLevel, minValue, maxValue, growth)
{
    if (currentLevel <= 0)
        currentLevel = 1;
    if (maxLevel <= 0)
        maxLevel = 1;
    if (currentLevel == 1)
        return minValue;
    if (currentLevel == maxLevel)
        return maxValue;
    return minValue + Math.round((maxValue - minValue) * Math.pow((currentLevel - 1) / (maxLevel - 1), growth));
}

function CalculateFloatAttribute(currentLevel, maxLevel, minValue, maxValue, growth)
{
    if (currentLevel <= 0)
        currentLevel = 1;
    if (maxLevel <= 0)
        maxLevel = 1;
    if (currentLevel == 1)
        return minValue;
    if (currentLevel == maxLevel)
        return maxValue;
    return minValue + ((maxValue - minValue) * Math.pow((currentLevel - 1) / (maxLevel - 1), growth));
}

function CalculatePlayerLevel(exp)
{
    var maxLevel = gameDatabase.playerMaxLevel;
    var expTable = gameDatabase.playerExpTable;
    return CalculateLevel(exp, maxLevel, expTable.minValue, expTable.maxValue, expTable.growth);
}

function CalculateItemLevel(exp, itemTier)
{
    var maxLevel = itemTier.maxLevel;
    var expTable = itemTier.expTable;
    return CalculateLevel(exp, maxLevel, expTable.minValue, expTable.maxValue, expTable.growth);
}

function CalculateLevel(exp, maxLevel, minValue, maxValue, growth)
{
    var remainExp = exp;
    var level = 1;
    for (level = 1; level < maxLevel; ++level)
    {
        var nextExp = CalculateIntAttribute(level, maxLevel, minValue, maxValue, growth);
        if (remainExp - nextExp < 0)
            break;
        remainExp -= nextExp;
    }
    return level;
}

function CanItemBeMaterial(item)
{
    return (!item.equipItemId || item.equipItemId.length === 0);
}

function CanSellItem(item)
{
    return (!item.equipItemId || item.equipItemId.length === 0);
}

function CalculateItemLevelUpPrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixLevelUpPrice)
        return itemData.fixLevelUpPrice;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var levelUpPriceTable = itemTier.levelUpPriceTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, levelUpPriceTable.minValue, levelUpPriceTable.maxValue, levelUpPriceTable.growth);
}

function CalculateItemEvolvePrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    return itemTier.evolvePrice;
}

function CalculateItemRewardExp(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixRewardExp)
        return itemData.fixRewardExp;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var rewardExpTable = itemTier.rewardExpTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, rewardExpTable.minValue, rewardExpTable.maxValue, rewardExpTable.growth);
}

function CalculateItemSellPrice(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return 0;
        
    if (itemData.useFixSellPrice)
        return itemData.fixSellPrice;
        
    var itemTier = itemData.itemTier;
    if (!itemTier)
        return 0;
        
    var sellPriceTable = itemTier.sellPriceTable;
    var currentLevel = CalculateItemLevel(item.exp, itemTier);
    return CalculateIntAttribute(currentLevel, itemTier.maxLevel, sellPriceTable.minValue, sellPriceTable.maxValue, sellPriceTable.growth);
}

function GetItemEvolveMaterials(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return [];
        
    var evolveInfo = itemData.evolveInfo;
    if (!evolveInfo)
        return [];
        
    return evolveInfo.requiredMaterials;
}

function GetItemEvolve(item)
{
    var itemData = gameDatabase.items[item.dataId];
    if (!itemData)
        return item;
        
    var evolveInfo = itemData.evolveInfo;
    if (!evolveInfo)
        return item;
        
    item.dataId = evolveInfo.evolveItem;
    if (gameDatabase.resetItemLevelAfterEvolve)
        item.exp = 0;
    return item;
}

function GeneratePlayerBattleId()
{
    return GenerateUUID();
}

function CreatePlayerBattle(playerId, dataId, session)
{
    return {
        "id" : GeneratePlayerBattleId(),
        "playerId" : playerId,
        "dataId" : dataId,
        "session" : session,
        "battleResult" : ENUM_BATTLE_RESULT_NONE,
        "rating" : 0,
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerClearStageId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerClearStage(playerId, dataId)
{
    return {
        "id" : GeneratePlayerClearStageId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "bestRating" : 0,
        "timestamp" : new Date().getTime(),
    }
}

function GeneratePlayerFormationId(playerId, dataId, position)
{
    return (playerId + "-" + dataId + "-" + position).split('_').join('-');
}

function CreatePlayerFormation(playerId, dataId, position)
{
    return {
        "id" : GeneratePlayerFormationId(playerId, dataId, position),
        "playerId" : playerId,
        "dataId" : dataId,
        "position" : position,
        "itemId" : "",
        "timestamp" : new Date().getTime(),
    }
}

function GeneratePlayerItemId()
{
    return GenerateUUID();
}

function CreatePlayerItem(playerId, dataId)
{
    return {
        "id" : GeneratePlayerItemId(),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 1,
        "exp" : 0,
        "equipItemId" : "",
        "equipPosition" : "",
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerStaminaId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerStamina(playerId, dataId)
{
    return {
        "id" : GeneratePlayerStaminaId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
        "recoveredTime" : 0,
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerUnlockItemId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerUnlockItem(playerId, dataId)
{
    return {
        "id" : GeneratePlayerUnlockItemId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "amount" : 0,
        "timestamp" : new Date().getTime(),
    };
}

function GeneratePlayerAchievementId(playerId, dataId)
{
    return (playerId + "-" + dataId).split('_').join('-');
}

function CreatePlayerAchievement(playerId, dataId)
{
    return {
        "id" : GeneratePlayerAchievementId(playerId, dataId),
        "playerId" : playerId,
        "dataId" : dataId,
        "progress" : 0,
        "earned" : false,
        "timestamp" : new Date().getTime(),
    };
}
    
function SetNewPlayerData(playerId)
{
    var firstFormation = gameDatabase.formations[0];
    var player = Spark.loadPlayer(playerId);
    player.setScriptData("exp", 0);
    player.setScriptData("selectedFormation", firstFormation);
    
    // Clear Stage
    var clearStageCursor = API.queryItems(colPlayerClearStage, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (clearStageCursor.hasNext())
    {
        clearStageCursor.next().delete();
    }
    // Formation
    var formationCursor = API.queryItems(colPlayerFormation, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (formationCursor.hasNext())
    {
        formationCursor.next().delete();
    }
    // Item
    var itemCursor = API.queryItems(colPlayerItem, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (itemCursor.hasNext())
    {
        itemCursor.next().delete();
    }
    // Stamina
    var staminaCursor = API.queryItems(colPlayerStamina, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (staminaCursor.hasNext())
    {
        staminaCursor.next().delete();
    }
    // Unlock Item
    var unlockItemCursor = API.queryItems(colPlayerUnlockItem, API.S("playerId").eq(playerId), API.sort("dataId", false)).cursor();
    while (unlockItemCursor.hasNext())
    {
        unlockItemCursor.next().delete();
    }
    
    var startItems = gameDatabase.startItems;
    var countStartItems = startItems.length;
    for (var i = 0; i < countStartItems; ++i)
    {
        var startItem = startItems[i];
        var addItemsResult = AddItems(playerId, startItem.id, startItem.amount);
        if (addItemsResult.success)
        {
            var createItems = addItemsResult.createItems;
            var updateItems = addItemsResult.updateItems;
            var countCreateItems = createItems.length;
            var countUpdateItems = updateItems.length;
            for (var j = 0; j < countCreateItems; ++j)
            {
                var createItem = createItems[j];
                var newItemEntry = API.createItem(colPlayerItem, createItem.id);
                newItemEntry.setData(createItem);
                newItemEntry.persistor().persist().error();
                HelperUnlockItem(playerId, createItem.dataId);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItems[j];
                var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                var updateItemEntry = updateItemResult.document();
                updateItemEntry.setData(updateItem);
                updateItemEntry.persistor().persist().error();
            }
        }
    }
    
    var startCharacters = gameDatabase.startCharacters;
    var countStartCharacters = startCharacters.length;
    for (var i = 0; i < countStartCharacters; ++i)
    {
        var startCharacter = startCharacters[i];
        var addItemsResult = AddItems(playerId, startCharacter, 1);
        if (addItemsResult.success)
        {
            var createItems = addItemsResult.createItems;
            var updateItems = addItemsResult.updateItems;
            var countCreateItems = createItems.length;
            var countUpdateItems = updateItems.length;
            for (var j = 0; j < countCreateItems; ++j)
            {
                var createItem = createItems[j];
                var newItemEntry = API.createItem(colPlayerItem, createItem.id);
                newItemEntry.setData(createItem);
                newItemEntry.persistor().persist().error();
                HelperUnlockItem(playerId, createItem.dataId);
                HelperSetFormation(playerId, createItem.id, firstFormation, i);
            }
            for (var j = 0; j < countUpdateItems; ++j)
            {
                var updateItem = updateItems[j];
                var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                var updateItemEntry = updateItemResult.document();
                updateItemEntry.setData(updateItem);
                updateItemEntry.persistor().persist().error();
            }
        }
    }
}

function DecreasePlayerStamina(playerId, staminaType, decreaseAmount)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
        return;
    
    var player = Spark.loadPlayer(playerId);
    var exp = player.getScriptData("exp");
    var stamina = GetStamina(playerId, staminaTable.id);
    var currentLevel = CalculatePlayerLevel(exp);
    var maxLevel = gameDatabase.playerMaxLevel;
    var maxAmountTable = staminaTable.maxAmountTable;
    var maxStamina = CalculateIntAttribute(currentLevel, maxLevel, maxAmountTable.minValue, maxAmountTable.maxValue, maxAmountTable.growth);
    if (stamina.amount >= decreaseAmount)
    {
        if (stamina.amount >= maxStamina && stamina.amount - decreaseAmount < maxStamina)
            stamina.recoveredTime = GetTimestamp();
        stamina.amount -= decreaseAmount;
        var doc = API.getItem(colPlayerStamina, stamina.id).document();
        if (doc)
        {
            doc.setData(stamina);
            doc.persistor().persist().error();
        }
        UpdatePlayerStamina(playerId, staminaType);
        return true;
    }
    return false;
}

function UpdatePlayerStamina(playerId, staminaType)
{
    var staminaTable = gameDatabase.staminas[staminaType];
    if (!staminaTable)
    {
        Spark.getLog().error("Stamina not found: " + staminaType);
        return;
    }
    
    var player = Spark.loadPlayer(playerId);
    var exp = player.getScriptData("exp");
    var stamina = GetStamina(playerId, staminaTable.id);
    var currentLevel = CalculatePlayerLevel(exp);
    var maxLevel = gameDatabase.playerMaxLevel;
    var maxAmountTable = staminaTable.maxAmountTable;
    var maxStamina = CalculateIntAttribute(currentLevel, maxLevel, maxAmountTable.minValue, maxAmountTable.maxValue, maxAmountTable.growth);
    if (stamina.amount < maxStamina)
    {
        var currentTimeInSecond = GetTimestamp();
        var diffTimeInSecond = currentTimeInSecond - stamina.recoveredTime;
        var devideAmount = 1;
        switch (staminaTable.recoverUnit)
        {
            case ENUM_STAMINA_UNIT_DAYS:
                devideAmount = 60 * 60 * 24;
                break;
            case ENUM_STAMINA_UNIT_HOURS:
                devideAmount = 60 * 60;
                break;
            case ENUM_STAMINA_UNIT_MINUTES:
                devideAmount = 60;
                break;
            case ENUM_STAMINA_UNIT_SECONDS:
                devideAmount = 1;
                break;
        }
        var recoveryAmount = Math.floor((diffTimeInSecond / devideAmount) / staminaTable.recoverDuration);
        if (recoveryAmount > 0)
        {
            stamina.amount += recoveryAmount;
            if (stamina.amount > maxStamina)
                stamina.amount = maxStamina;
            stamina.recoveredTime = currentTimeInSecond;
            var doc = API.getItem(colPlayerStamina, stamina.id).document();
            if (doc)
            {
                doc.setData(stamina);
                doc.persistor().persist().error();
            }
        }
    }
}

function UpdateAllPlayerStamina(playerId)
{
    UpdatePlayerStamina(playerId, "STAGE");
    UpdatePlayerStamina(playerId, "ARENA");
}

function GetCurrency(playerId, dataId)
{
    var player = Spark.loadPlayer(playerId);
    return { "id" : playerId + "_" + dataId, "playerId" : playerId, "dataId" : dataId, "amount" : player.getBalance(dataId) };
}

function GetStamina(playerId, dataId)
{
    var queryResult = API.queryItems(
        colPlayerStamina,
        API.S("playerId").eq(playerId).and(API.S("dataId").eq(dataId)),
        API.sort("id", false));
    var result = queryResult.cursor();
    var stamina;
    if (!result.hasNext())
    {
        stamina = CreatePlayerStamina(playerId, dataId);
        var id = stamina.id;
        var newEntry = API.createItem(colPlayerStamina, id);
        newEntry.setData(stamina);
        newEntry.persistor().persist().error();
    }
    else
    {
        stamina = result.next().getData();
    }
    return stamina;
}

function GetPlayer(playerId)
{
    var player = Spark.loadPlayer(playerId);
    return {
        "id" : playerId,
        "profileName" : player.getDisplayName(),
        "exp" : player.getScriptData("exp"),
        "selectedFormation" : player.getScriptData("selectedFormation"),
        "selectedArenaFormation" : player.getScriptData("selectedArenaFormation"),
        "arenaScore" : player.getScriptData("arenaScore"),
        "highestArenaRank" : player.getScriptData("highestArenaRank"),
        "highestArenaRankCurrentSeason" : player.getScriptData("highestArenaRankCurrentSeason")
    };
}

function GetItemRandomAttributes(dataId)
{
    var item = gameDatabase.items[dataId];
    if (!item || !item.randomAttributes)
        return {};

    var minType = 0;
    if (randomAttributes.minType) {
        minType = randomAttributes.minType;
    }
    var maxType = 0;
    if (randomAttributes.maxType) {
        maxType = randomAttributes.maxType;
    }
    var minHp = 0;
    if (randomAttributes.minHp) {
        minHp = randomAttributes.minHp;
    }
    var maxHp = 0;
    if (randomAttributes.maxHp) {
        maxHp = randomAttributes.maxHp;
    }
    var minPAtk = 0;
    if (randomAttributes.minPAtk) {
        minPAtk = randomAttributes.minPAtk;
    }
    var maxPAtk = 0;
    if (randomAttributes.maxPAtk) {
        maxPAtk = randomAttributes.maxPAtk;
    }
    var minPDef = 0;
    if (randomAttributes.minPDef) {
        minPDef = randomAttributes.minPDef;
    }
    var maxPDef = 0;
    if (randomAttributes.maxPDef) {
        maxPDef = randomAttributes.maxPDef;
    }
    var minMAtk = 0;
    if (randomAttributes.minMAtk) {
        minMAtk = randomAttributes.minMAtk;
    }
    var maxMAtk = 0;
    if (randomAttributes.maxMAtk) {
        maxMAtk = randomAttributes.maxMAtk;
    }
    var minMDef = 0;
    if (randomAttributes.minMDef) {
        minMDef = randomAttributes.minMDef;
    }
    var maxMDef = 0;
    if (randomAttributes.maxMDef) {
        maxMDef = randomAttributes.maxMDef;
    }
    var minSpd = 0;
    if (randomAttributes.minSpd) {
        minSpd = randomAttributes.minSpd;
    }
    var maxSpd = 0;
    if (randomAttributes.maxSpd) {
        maxSpd = randomAttributes.maxSpd;
    }
    var minEva = 0;
    if (randomAttributes.minEva) {
        minEva = randomAttributes.minEva;
    }
    var maxEva = 0;
    if (randomAttributes.maxEva) {
        maxEva = randomAttributes.maxEva;
    }
    var minAcc = 0;
    if (randomAttributes.minAcc) {
        minAcc = randomAttributes.minAcc;
    }
    var maxAcc = 0;
    if (randomAttributes.maxAcc) {
        maxAcc = randomAttributes.maxAcc;
    }
    var minCritChance = 0;
    if (randomAttributes.minCritChance) {
        minCritChance = randomAttributes.minCritChance;
    }
    var maxCritChance = 0;
    if (randomAttributes.maxCritChance) {
        maxCritChance = randomAttributes.maxCritChance;
    }
    var minCritDamageRate = 0;
    if (randomAttributes.minCritDamageRate) {
        minCritDamageRate = randomAttributes.minCritDamageRate;
    }
    var maxCritDamageRate = 0;
    if (randomAttributes.maxCritDamageRate) {
        maxCritDamageRate = randomAttributes.maxCritDamageRate;
    }
    var minBlockChance = 0;
    if (randomAttributes.minBlockChance) {
        minBlockChance = randomAttributes.minBlockChance;
    }
    var maxBlockChance = 0;
    if (randomAttributes.maxBlockChance) {
        maxBlockChance = randomAttributes.maxBlockChance;
    }
    var minBlockDamageRate = 0;
    if (randomAttributes.minBlockDamageRate) {
        minBlockDamageRate = randomAttributes.minBlockDamageRate;
    }
    var maxBlockDamageRate = 0;
    if (randomAttributes.maxBlockDamageRate) {
        maxBlockDamageRate = randomAttributes.maxBlockDamageRate;
    }
    var minResistanceChance = 0;
    if (randomAttributes.minResistanceChance) {
        minResistanceChance = randomAttributes.minResistanceChance;
    }
    var maxResistanceChance = 0;
    if (randomAttributes.maxResistanceChance) {
        maxResistanceChance = randomAttributes.maxResistanceChance;
    }
    
    var result = {};
    var randomingAmounts = {};
    var tempIntVal = 0;
    var tempFloatVal = 0;
    // Hp
    tempIntVal = RandomRange(minHp, maxHp);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_HP] = tempIntVal;
    // PAtk
    tempIntVal = RandomRange(minPAtk, maxPAtk);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_PATK] = tempIntVal;
    // PDef
    tempIntVal = RandomRange(minPDef, maxPDef);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_PDEF] = tempIntVal;
    // MAtk
    tempIntVal = RandomRange(minMAtk, maxMAtk);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_MATK] = tempIntVal;
    // MDef
    tempIntVal = RandomRange(minMDef, maxMDef);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_MDEF] = tempIntVal;
    // Spd
    tempIntVal = RandomRange(minSpd, maxSpd);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_SPD] = tempIntVal;
    // Eva
    tempIntVal = RandomRange(minEva, maxEva);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_EVA] = tempIntVal;
    // Acc
    tempIntVal = RandomRange(minAcc, maxAcc);
    if (tempIntVal != 0)
        randomingAmounts[ENUM_ACC] = tempIntVal;
    // Crit Chance
    tempFloatVal = RandomRange(minCritChance, maxCritChance);
    if (tempFloatVal != 0)
        randomingAmounts[ENUM_CRIT_CHANCE] = tempFloatVal;
    // Crit Damage Rate
    tempFloatVal = RandomRange(minCritDamageRate, maxCritDamageRate);
    if (tempFloatVal != 0)
        randomingAmounts[ENUM_CRIT_DAMAGE_RATE] = tempFloatVal;
    // Block Chance
    tempFloatVal = RandomRange(minBlockChance, maxBlockChance);
    if (tempFloatVal != 0)
        randomingAmounts[ENUM_BLOCK_CHANCE] = tempFloatVal;
    // Block Damage Rate
    tempFloatVal = RandomRange(minBlockDamageRate, maxBlockDamageRate);
    if (tempFloatVal != 0)
        randomingAmounts[ENUM_BLOCK_DAMAGE_RATE] = tempFloatVal;
    // Resistance
    tempFloatVal = RandomRange(minResistanceChance, maxResistanceChance);
    if (tempFloatVal != 0)
        randomingAmounts[ENUM_RESISTANCE_CHANCE] = tempFloatVal;
    
    var shufflingKeys = ShuffleArray(Object.keys(randomingAmounts));
    tempIntVal = RandomRange(minType, maxType);
    if (randomingAmounts.length < tempIntVal)
        tempIntVal = randomingAmounts.length;

    for (var i = 0; i < tempIntVal; ++i) {
        switch (shufflingKeys[i])
        {
            case ENUM_HP:
                result.hp = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_PATK:
                result.pAtk = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_PDEF:
                result.pDef = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_MATK:
                result.mAtk = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_MDEF:
                result.mDef = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_SPD:
                result.spd = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_EVA:
                result.eva = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_ACC:
                result.acc = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_CRIT_CHANCE:
                result.critChance = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_CRIT_DAMAGE_RATE:
                result.critDamageRate = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_BLOCK_CHANCE:
                result.blockChance = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_BLOCK_DAMAGE_RATE:
                result.blockDamageRate = randomingAmounts[shufflingKeys[i]];
            break;
            case ENUM_RESISTANCE_CHANCE:
                result.resistanceChance = randomingAmounts[shufflingKeys[i]];
            break;
        }
    }

    result;
}

function AddItems(playerId, dataId, amount)
{
    var item = gameDatabase.items[dataId];
    if (!item)
        return { "success" : false };
        
    var maxStack = item.maxStack;
    var queryResult = API.queryItems(
        colPlayerItem,
        API.S("playerId").eq(playerId).and(API.S("dataId").eq(dataId)).and(API.N("amount").lt(maxStack)),
        API.sort("id", false));
    var oldEntries = queryResult.cursor();
    var createItems = [];
    var updateItems = [];
    while (oldEntries.hasNext())
    {
        var entry = oldEntries.next().getData();
        var sumAmount = entry.amount + amount;
        if (sumAmount > maxStack)
        {
            entry.amount = maxStack;
            amount = sumAmount - maxStack;
        }
        else
        {
            entry.amount += amount;
            amount = 0;
        }
        updateItems.push(entry);

        if (amount == 0)
            break;
    }
    while (amount > 0)
    {
        var newEntry = CreatePlayerItem(playerId, dataId);
        newEntry.randomedAttributes = GetItemRandomAttributes(dataId);
        if (amount > maxStack)
        {
            newEntry.amount = maxStack;
            amount -= maxStack;
        }
        else
        {
            newEntry.amount = amount;
            amount = 0;
        }
        createItems.push(newEntry);
    }
    return { "success" : true, "createItems" : createItems, "updateItems" : updateItems }
}

function HelperSetFormation(playerId, characterId, formationName, position)
{
    var newFormation;
    var oldFormation;
    var oldFormationEntry;
    if (characterId && characterId.length > 0)
    {
        var oldQueryResult = API.queryItems(colPlayerFormation,
            API.S("playerId").eq(playerId));
        var oldResult = oldQueryResult.cursor();
        while (oldResult.hasNext())
        {
            var entry = oldResult.next();
            var entryData = entry.getData();
            if (entryData.itemId == characterId && entryData.dataId == formationName)
            {
                oldFormationEntry = entry;
                oldFormation = entryData;
                oldFormation.itemId = "";
                oldFormationEntry.setData(oldFormation);
                oldFormationEntry.persistor().persist().error();
            }
        }
    }
    var formation;
    var formationDoc = API.getItem(colPlayerFormation, GeneratePlayerFormationId(playerId, formationName, position)).document();
    if (formationDoc)
    {
        formation = formationDoc.getData();
    }
    if (!formation)
    {
        formation = CreatePlayerFormation(playerId, formationName, position);
        formation.itemId = characterId;
        var newEntry = API.createItem(colPlayerFormation, formation.id);
        newEntry.setData(formation);
        newEntry.persistor().persist().error();
        newFormation = formation;
    }
    else
    {
        if (oldFormation)
        {
            oldFormation.itemId = formation.itemId;
            oldFormationEntry.setData(oldFormation);
            oldFormationEntry.persistor().persist().error();
        }
        formation.itemId = characterId;
        formationDoc.setData(formation);
        formationDoc.persistor().persist().error();
    }
    if (!oldFormation)
    {
        oldFormation = {};
    }
    if (!newFormation)
    {
        newFormation = {};
    }
    return { oldFormation: oldFormation, newFormation: newFormation };
}

function HelperUnlockItem(playerId, dataId)
{
    var unlockItem;
    var unlockItemDoc = API.getItem(colPlayerUnlockItem, GeneratePlayerUnlockItemId(playerId, dataId)).document();
    if (unlockItemDoc)
    {
        unlockItem = unlockItemDoc.getData();
    }
    if (!unlockItem)
    {
        unlockItem = CreatePlayerUnlockItem(playerId, dataId);
        var newEntry = API.createItem(colPlayerUnlockItem, unlockItem.id);
        newEntry.setData(unlockItem);
        newEntry.persistor().persist().error();
    }
    return unlockItem;
}

function HelperClearStage(apiResult, player, playerId, stage, rating)
{
    var clearStage;
    var clearStageDoc = API.getItem(colPlayerClearStage, GeneratePlayerClearStageId(playerId, stage.id)).document();
    if (clearStageDoc)
    {
        clearStage = clearStageDoc.getData();
    }
    if (!clearStage)
    {
        clearStage = CreatePlayerClearStage(playerId, stage.id);
        clearStage.bestRating = rating;
        var newEntry = API.createItem(colPlayerClearStage, clearStage.id);
        newEntry.setData(clearStage);
        newEntry.persistor().persist().error();
        // First clear rewards
        var updateCurrencies = [];
        var createItems = apiResult.createItems;
        var updateItems = apiResult.updateItems;
        var firstClearRewardPlayerExp = stage.firstClearRewardPlayerExp;
        var firstClearRewardSoftCurrency = stage.firstClearRewardSoftCurrency;
        var firstClearRewardHardCurrency = stage.firstClearRewardHardCurrency;
        var firstClearRewardItems = [];
        // Player exp
        var playerExp = player.getScriptData("exp");
        playerExp += firstClearRewardPlayerExp;
        player.setScriptData("exp", playerExp);
        // Soft currency
        player.credit(gameDatabase.currencies.SOFT_CURRENCY, firstClearRewardSoftCurrency, "First Pass Stage [" + stage.id + "]");
        var softCurrency = GetCurrency(playerId, gameDatabase.currencies.SOFT_CURRENCY);
        updateCurrencies.push(softCurrency);
        // Hard currency
        player.credit(gameDatabase.currencies.HARD_CURRENCY, firstClearRewardHardCurrency, "First Pass Stage [" + stage.id + "]");
        var hardCurrency = GetCurrency(playerId, gameDatabase.currencies.HARD_CURRENCY);
        updateCurrencies.push(hardCurrency);
        // Items
        var countRewardItems = stage.firstClearRewardItems.length;
        for (var i = 0; i < countRewardItems; ++i)
        {
            var rewardItem = stage.firstClearRewardItems[i];
            if (!rewardItem || !rewardItem.id)
            {
                continue;
            }
                
            var addItemsResult = AddItems(playerId, rewardItem.id, rewardItem.amount);
            if (addItemsResult.success)
            {
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
                    firstClearRewardItems.push(createItem);
                    createItems.push(createItem);
                }
                for (var j = 0; j < countUpdateItems; ++j)
                {
                    var updateItem = addItemsResult.updateItems[j];
                    var updateItemResult = API.getItem(colPlayerItem, updateItem.id);
                    var updateItemEntry = updateItemResult.document();
                    updateItemEntry.setData(updateItem);
                    updateItemEntry.persistor().persist().error();
                    firstClearRewardItems.push(updateItem);
                    updateItems.push(updateItem);
                }
            }
            // End add item condition
        }
        // End reward items loop
        apiResult.isFirstClear = true;
        apiResult.updateCurrencies = updateCurrencies;
        apiResult.createItems = createItems;
        apiResult.updateItems = updateItems;
        apiResult.firstClearRewardPlayerExp = firstClearRewardPlayerExp;
        apiResult.firstClearRewardSoftCurrency = firstClearRewardSoftCurrency;
        apiResult.firstClearRewardHardCurrency = firstClearRewardHardCurrency;
        apiResult.firstClearRewardItems = firstClearRewardItems;
    }
    else
    {
        // If end stage with more rating, replace old rating
        if (clearStage.bestRating < rating)
        {
            clearStage.bestRating = rating;
            clearStageDoc.setData(clearStage);
            clearStageDoc.persistor().persist().error();
        }
    }
    apiResult.clearStage = clearStage;
    // Update achievement
    var playerAchievements = GetAchievementListInternal(playerId);
    var playerClearStages = GetClearStageListInternal(playerId);
    QueryUpdateAchievement(UpdateTotalClearStage(playerId, playerAchievements, playerClearStages));
    QueryUpdateAchievement(UpdateTotalClearStageRating(playerId, playerAchievements, playerClearStages));
    QueryUpdateAchievement(UpdateCountWinStage(playerId, playerAchievements));
    return apiResult;
}

function QueryUpdateAchievement(updateResult)
{
    for (var i = 0; i < updateResult.createAchievements.length; ++i)
    {
        var createAchievement = updateResult.createAchievements[i];
        var newAchievementId = createAchievement.id;
        var newItemEntry = API.createItem(colPlayerAchievement, newAchievementId);
        newItemEntry.setData(createAchievement);
        newItemEntry.persistor().persist().error();
    }
    for (var i = 0; i < updateResult.updateAchievements.length; ++i)
    {
        var updateAchievement = updateResult.updateAchievements[i];
        var updateAchievementResult = API.getItem(colPlayerAchievement, updateAchievement.id);
        var updateAchievementEntry = updateAchievementResult.document();
        updateAchievementEntry.setData(updateAchievement);
        updateAchievementEntry.persistor().persist().error();
    }
}

function GetFormationCharacterIds(playerId, playerSelectedFormation)
{
    var characterIds = [];
    var formationsQueryResult = API.queryItems(
        colPlayerFormation, 
        API.S("playerId").eq(playerId));
    var formationsResult = formationsQueryResult.cursor();
    while (formationsResult.hasNext())
    {
        var formationEntry = formationsResult.next();
        var formation = formationEntry.getData();
        if (formation.dataId == playerSelectedFormation && formation.itemId)
        {
            characterIds.push(formation.itemId);
        }
    }
    return characterIds;
}

function GetFormationCharacter(playerId, playerSelectedFormation)
{
    var characters = [];
    var characterIds = GetFormationCharacterIds(playerId, playerSelectedFormation);
    for (var i = 0; i < characterIds.length; ++i)
    {
        var characterId = characterIds[i];
        var characterQueryResult = API.getItem(colPlayerItem, characterId);
        var characterData = characterQueryResult.document().getData();
        if (characterData)
        {
            characters.push(characterData);
        }
    }
    return characters;
}

function GetLeaderCharacter(playerId, playerSelectedFormation)
{
    var characterData = undefined;
    var formationsQueryResult = API.queryItems(
        colPlayerFormation, 
        API.S("playerId").eq(playerId));
    var formationsResult = formationsQueryResult.cursor();
    while (formationsResult.hasNext())
    {
        var formationEntry = formationsResult.next();
        var formation = formationEntry.getData();
        if (formation.dataId == playerSelectedFormation && formation.itemId)
        {
            var characterQueryResult = API.getItem(colPlayerItem, formation.itemId);
            var currentCharacterData = characterQueryResult.document().getData();
            if (currentCharacterData)
            {
                if (!characterData)
                {
                    // Set first found character, will return it when leader not found
                    characterData = currentCharacterData;
                }
                if (formation.isLeader)
                {
                    return characterData;
                }
            }
        }
    }
    return characterData;
}

function CalculateArenaRankLevel(arenaScore)
{
    var level = 0;
    var count = gameDatabase.arenaRanks.length;
    for (var i = 0; i < count; ++i)
    {
        var arenaRank = gameDatabase.arenaRanks[i];
        if (arenaScore < arenaRank.scoreToRankUp)
            break;
        level++;
    }
    return level;
}

function GetArenaRank(arenaScore)
{
    
    var level = CalculateArenaRankLevel(arenaScore);
    if (level >= gameDatabase.arenaRanks.length)
        level = gameDatabase.arenaRanks.length - 1;
    return level >= 0 ? gameDatabase.arenaRanks[level] : undefined;
}

function GetSocialPlayer(playerId, targetPlayerId)
{
    var player = Spark.loadPlayer(targetPlayerId);
    if (player)
    {
        var queryResult = API.queryItems(colPlayerFriend, API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)), API.sort("timestamp", false));
        var result = queryResult.cursor();
        var isFriend = result.hasNext();
        var displayName = player.getDisplayName();
        var playerSelectedFormation = player.getScriptData("selectedFormation");
        var character = GetLeaderCharacter(targetPlayerId, playerSelectedFormation);
        if (displayName && character)
        {
            return {
                "id" : targetPlayerId,
                "profileName" : displayName,
                "exp" : player.getScriptData("exp"),
                "mainCharacter" : character.dataId,
                "mainCharacterExp" : character.exp,
                "isFriend" : isFriend
            };
        }
    }
    return undefined;
}

function GetPlayerIds()
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var playerIds = [];
    var queryResult = API.queryItems(colPlayer, API.S("playerId").ne(playerId));
    var result = queryResult.cursor();
    while (result.hasNext())
    {
        var entry = result.next();
        var data = entry.getData();
        playerIds.push(data.playerId);
    }
    return playerIds;
}