import {ITournamentGame, ITournamentGameBye, ITournamentGameReal} from "./tournament-game";
import {STATUS, STATUS_COMPLETED, STATUS_PLANNED} from "./status";
import {TOURNAMENT_SCORE_BYE, TOURNAMENT_SCORE_LOSS} from "./tournament";
import {
  buildOpponentsCandidates,
  buildWorkTournamentPlayers,
  getByePlayer,
  ITournamentPlayer,
  pruneWorkTournamentPlayers
} from "./tournament-player";
import {Result} from "ts-results";
import shortid from "shortid";
import {ICandidateGame} from "./candidate-game";
import {BLACK_PIECES, COLOR, WHITE_PIECES} from "./color";
import {alternatePlayingColor, idealPlayingColor} from "./candidate-player";

export type ITournamentRound = {
  id: string;
  games: ITournamentGame[];
  status: STATUS;
}

export const planRound = (players: ITournamentPlayer[]): ITournamentRound => {
  const tournamentRound: ITournamentRound = {
    id: shortid.generate(),
    games: [],
    status: STATUS_PLANNED
  }
  // build the workTournamentPlayers array
  let workTournamentPlayers: ITournamentPlayer[] = buildWorkTournamentPlayers(players);

  // Set the round bye player, if necessary
  let resultBye: Result<ITournamentPlayer, Error> = getByePlayer(workTournamentPlayers);
  if (resultBye.ok) {
    // We have a round bye player
    const byeGame: ITournamentGameBye = {
      id: shortid.generate(),
      byePlayer: <ITournamentPlayer>resultBye.val,
      byePlayerScore: TOURNAMENT_SCORE_BYE,
      status: STATUS_COMPLETED
    }
    tournamentRound['games'].push(byeGame)

    // remove the bye player from workTournamentPlayers
    workTournamentPlayers = pruneWorkTournamentPlayers(workTournamentPlayers, workTournamentPlayers[0].id);
  }

  // Attempt to pair players
  let resultColor: Result<COLOR, string>
  while (workTournamentPlayers.length > 0) {
    let candidateGame: ICandidateGame = {
      player_1: {
        candidate: {...workTournamentPlayers[0]},
        candidateColor: idealPlayingColor(workTournamentPlayers[0].lastTwoGamesColors),
      },
      player_2: {
        candidate: {...workTournamentPlayers[0]},
        candidateColor: idealPlayingColor(workTournamentPlayers[0].lastTwoGamesColors),
      }
    };
    const opponentCandidates = buildOpponentsCandidates(workTournamentPlayers);
    let colorsOk: Boolean = opponentCandidates.every((candidate) => {
      //  create a candidate game
       candidateGame.player_2 = {
          candidate: {...candidate},
          candidateColor: idealPlayingColor(candidate.lastTwoGamesColors)
       }
      if (candidateGame.player_1.candidateColor !== candidateGame.player_1.candidateColor) {
        // we have a valid game, get out of the every loop
        return false;
      }
      else {
        resultColor = alternatePlayingColor(candidateGame.player_1.candidate.lastTwoGamesColors)
        if (resultColor.ok) {
          // we have a valid game, get out of the every loop
          candidateGame.player_1.candidateColor = <COLOR>resultColor.val
          return false;
        }
      else {
          resultColor = alternatePlayingColor(candidateGame.player_2.candidate.lastTwoGamesColors)
          if (resultColor.ok) {
            // we have a valid game, get out of the every loop
            candidateGame.player_2.candidateColor = <COLOR>resultColor.val
            return false;
          }
          else {
            // keep looking for opponents
            return true
          }
        }
      }
    })
    if (!colorsOk) {
      //  We have to force an undesirable pairing. The lower ranked candidate gets the white pieces;
      candidateGame.player_2 = {
          candidate: {...opponentCandidates[0]},
          candidateColor: idealPlayingColor(opponentCandidates[0].lastTwoGamesColors)
      }
      if (candidateGame.player_1.candidateColor === WHITE_PIECES) {
        candidateGame.player_1.candidateColor = BLACK_PIECES
      }
      else {
        candidateGame.player_2.candidateColor = WHITE_PIECES
      }
    }

    // We have a candidateGame that can turn into a real game
    const gameReal: ITournamentGameReal = {
      id: shortid.generate(),
      whitePiecesPlayer: candidateGame.player_1.candidateColor === WHITE_PIECES ? {...candidateGame.player_1.candidate} : {...candidateGame.player_2.candidate},
      whitePiecesPlayerScore: TOURNAMENT_SCORE_LOSS,
      blackPiecesPlayer: candidateGame.player_1.candidateColor === BLACK_PIECES ? {...candidateGame.player_1.candidate} : {...candidateGame.player_2.candidate},
      blackPiecesPlayerScore: TOURNAMENT_SCORE_LOSS,
      status: STATUS_PLANNED
    }
    tournamentRound.games.push(gameReal)

    // remove the two players from workTournamentPlayers
    workTournamentPlayers = pruneWorkTournamentPlayers(workTournamentPlayers, candidateGame.player_1.candidate.id);
    workTournamentPlayers = pruneWorkTournamentPlayers(workTournamentPlayers, candidateGame.player_2.candidate.id);
  }

  // build the
  return tournamentRound;
}
