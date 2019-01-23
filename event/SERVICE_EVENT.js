// ====================================================================================================
//
// Cloud Code for SERVICE_EVENT, write your code here to customize the GameSparks platform.
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
require("SERVICE_LISTING");
require("SERVICE_BATTLE");
require("SERVICE_ITEM");
require("SERVICE_SOCIAL");

var logger = Spark.getLog();
var gsData = Spark.getData();
var target = gsData.TARGET;
var data = gsData.DATA;

if (target === "GetItemList")
{
    GetItemList();
}
else if (target === "GetCurrencyList")
{
    GetCurrencyList();
}
else if (target === "GetStaminaList")
{
    GetStaminaList();
}
else if (target === "GetFormationList")
{
    GetFormationList();
}
else if (target === "GetUnlockItemList")
{
    GetUnlockItemList();
}
else if (target === "GetClearStageList")
{
    GetClearStageList();
}
else if (target === "StartStage")
{
    StartStage(data.stageDataId);
}
else if (target === "FinishStage")
{
    FinishStage(data.session, data.battleResult, data.deadCharacters);
}
else if (target === "ReviveCharacters")
{
    ReviveCharacters();
}
else if (target === "SelectFormation")
{
    SelectFormation(data.formationName);
}
else if (target === "SetFormation")
{
    SetFormation(data.characterId, data.formationName, data.position);
}
else if (target === "LevelUpItem")
{
    LevelUpItem(data.itemId, data.materials);
}
else if (target === "EvolveItem")
{
    EvolveItem(data.itemId, data.materials);
}
else if (target === "SellItems")
{
    SellItems(data.items);
}
else if (target === "EquipItem")
{
    EquipItem(data.characterId, data.equipmentId, data.equipPosition);
}
else if (target === "UnEquipItem")
{
    UnEquipItem(data.equipmentId);
}
else if (target === "GetAvailableLootBoxList")
{
    GetAvailableLootBoxList();
}
else if (target === "OpenLootBox")
{
    OpenLootBox(data.lootBoxDataId, data.packIndex);
}
else if (target === "GetHelperList")
{
    GetHelperList();
}
else if (target === "GetFriendList")
{
    GetFriendList();
}
else if (target === "GetFriendRequestList")
{
    GetFriendRequestList();
}
else if (target === "FriendRequest")
{
    FriendRequest(data.targetPlayerId);
}
else if (target === "FriendAccept")
{
    FriendAccept(data.targetPlayerId);
}
else if (target === "FriendDecline")
{
    FriendDecline(data.targetPlayerId);
}
else if (target === "FriendDelete")
{
    FriendDelete(data.targetPlayerId);
}

// Set service time, it will be used at client side to set time offset stuffs
Spark.setScriptData("serviceTime", Date.now());