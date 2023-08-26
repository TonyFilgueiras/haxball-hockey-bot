// function setPenaltyBlocks(room: RoomObject, goalie: PlayerObject, kickingTeam: Team): void {
//     const players = room.getPlayerList();

//     const defenseTeam = players.filter(p => p.team !== kickingTeam && p.id !== goalie.id && p.team !== Team.Spec);
//     const offenseTeam = players.filter(p => p.team === kickingTeam);

//     defenseTeam.forEach(p => {
//         const cGroup = p.team === Team.Red ?
//             room.CollisionFlags.c0 | room.CollisionFlags.red :
//             room.CollisionFlags.c1 | room.CollisionFlags.blue;

//         room.setPlayerDiscProperties(p.id, { cGroup });
//     });

//     offenseTeam.forEach(p => {
//         const cGroup = p.team === Team.Red ?
//             room.CollisionFlags.c2 | room.CollisionFlags.red :
//             room.CollisionFlags.c3 | room.CollisionFlags.blue;

//         room.setPlayerDiscProperties(p.id, { cGroup });
//     });
// }

// function removePenaltyBlocks(room: RoomObject) {
//     room.getPlayerList().filter(p => p.team !== Team.Spec).forEach(p =>
//         room.setPlayerDiscProperties(p.id, { cGroup: p.team === Team.Red ? room.CollisionFlags.red : room.CollisionFlags.blue })
//     );
// }