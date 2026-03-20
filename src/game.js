import { cardLibrary } from './cardLibrary'
let gameState = {
    bank: 0,
}
export const playerA = {
    bankSpent: 0,
}
export const playerB = {
    bankSpent: 0,
}
//test bank
export function rollBank() {
    gameState.bank = Math.floor(Math.random()*6)+1
    playerA.bankSpent= 0
    playerB.bankSpent= 0
    return gameState.bank
}
export function getRemainingBank(player){
    return gameState.bank-player.bankSpent
}
export function spendFromBank(player,cost){
   // console.log('gameState.bank:', gameState.bank)
    //console.log('player.bankSpent before:', player.bankSpent)
    if (cost <= getRemainingBank(player)){
        player.bankSpent+= cost
        //console.log('player.bankSpent after:', player.bankSpent)
        return true
    }
    return false
}
export {cardLibrary, gameState}

