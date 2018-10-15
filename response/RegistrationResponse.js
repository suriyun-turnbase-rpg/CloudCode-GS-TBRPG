// ====================================================================================================
//
// Cloud Code for RegistrationResponse, write your code here to customize the GameSparks platform.
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
var colPlayer = "player";
var userId = Spark.getData().userId;
var newPlayer = Spark.getData().newPlayer;

if (newPlayer)
{
    SetNewPlayerData(userId);
    UpdateAllPlayerStamina(userId);
}

var playerQueryResult = API.queryItems(
    colPlayer, 
    API.S("playerId").eq(userId));
var playerResult = playerQueryResult.cursor();
if (!playerResult.hasNext())
{
    var newEntry = API.createItem(colPlayer, userId);
    newEntry.setData({
        "playerId" : userId
    });
    newEntry.persistor().persist().error();
}
