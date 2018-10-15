// ====================================================================================================
//
// Cloud Code for SERVICE_LISTING, write your code here to customize the GameSparks platform.
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
var colPlayerFriend = "playerFriend";
var colPlayerFriendRequest = "playerFriendRequest";

function FriendRequest(targetPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var friendQueryResult = API.queryItems(
        colPlayerFriend, 
        API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
    var friendResult = friendQueryResult.cursor();
    if (!friendResult.hasNext())
    {
        var requestQueryResult = API.queryItems(
            colPlayerFriendRequest, 
            API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
        var requestResult = requestQueryResult.cursor();
        if (!requestResult.hasNext())
        {
            var newId = GenerateUUID();
            var newRequestEntry = API.createItem(colPlayerFriendRequest, newId);
            newRequestEntry.setData({
                "id" : newId,
                "playerId" : playerId,
                "targetPlayerId" : targetPlayerId,
            });
            newRequestEntry.persistor().persist().error();
        }
    }
}

function FriendAccept(targetPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    // Remove request
    var requestQueryResult = API.queryItems(
        colPlayerFriendRequest, 
        API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
    var requestResult = requestQueryResult.cursor();
    if (requestResult.hasNext())
    {
        requestResult.next().delete();
    }
    // Remove request for both side
    var requestQueryResultB = API.queryItems(
        colPlayerFriendRequest, 
        API.S("playerId").eq(targetPlayerId).and(API.S("targetPlayerId").eq(playerId)));
    var requestResultB = requestQueryResultB.cursor();
    if (requestResultB.hasNext())
    {
        requestResultB.next().delete();
    }
    // Add friend
    var friendQueryResult = API.queryItems(
        colPlayerFriend, 
        API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
    var friendResult = friendQueryResult.cursor();
    if (!friendResult.hasNext())
    {
        var newId = GenerateUUID();
        var newFriendEntry = API.createItem(colPlayerFriend, newId);
        newFriendEntry.setData({
            "id" : newId,
            "playerId" : playerId,
            "targetPlayerId" : targetPlayerId,
        });
        newFriendEntry.persistor().persist().error();
    }
    // Add friend for both side
    var friendQueryResultB = API.queryItems(
        colPlayerFriend, 
        API.S("playerId").eq(targetPlayerId).and(API.S("targetPlayerId").eq(playerId)));
    var friendResultB = friendQueryResultB.cursor();
    if (!friendResultB.hasNext())
    {
        var newId = GenerateUUID();
        var newFriendEntry = API.createItem(colPlayerFriend, newId);
        newFriendEntry.setData({
            "id" : newId,
            "playerId" : targetPlayerId,
            "targetPlayerId" : playerId,
        });
        newFriendEntry.persistor().persist().error();
    }
}

function FriendDecline(targetPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    // Remove request
    var requestQueryResult = API.queryItems(
        colPlayerFriendRequest, 
        API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
    var requestResult = requestQueryResult.cursor();
    if (requestResult.hasNext())
    {
        requestResult.next().delete();
    }
    // Remove request for both side
    var requestQueryResultB = API.queryItems(
        colPlayerFriendRequest, 
        API.S("playerId").eq(targetPlayerId).and(API.S("targetPlayerId").eq(playerId)));
    var requestResultB = requestQueryResultB.cursor();
    if (requestResultB.hasNext())
    {
        requestResultB.next().delete();
    }
}

function FriendDelete(targetPlayerId)
{
    var player = Spark.getPlayer();
    var playerId = player.getPlayerId();
    var requestQueryResult = API.queryItems(
        colPlayerFriend, 
        API.S("playerId").eq(playerId).and(API.S("targetPlayerId").eq(targetPlayerId)));
    var requestResult = requestQueryResult.cursor();
    if (requestResult.hasNext())
    {
        requestResult.next().delete();
    }
}