import React, {useEffect, useState} from 'react';
import {
    randomIntFromInterval,
    gerisarLinkedList,
    useInterval,
} from '../lib/utils.js';

import './Board.css';
class LinkedListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    } 
}

class LinkedList {
    constructor(value) {
        const node = new LinkedListNode(value);
        this.head = node;
        this.tail = node;
    }
}

const Direction = {
    UP: 'UP',
    RIGHT: 'RIGHT',
    DOWN: 'DOWN',
    LEFT: 'LEFT',
};

const ZEMIN_BOYUT = 15;
const PROBABILITY_OF_DIRECTION_REVERSAL_FOOD = 0.6;

const yilanBaslangicNoktasiGetir = zemin => {
    const rowSize = zemin.length; // Row sayısı (boyuna)
    const colSize = zemin[0].length // İlk row'un column sayısı (enine)
    const startingRow = Math.round(rowSize / 3); // row sayisini 3'e bol, sonucu yuvarla
    const startingCol = Math.round(colSize / 3); // column sayisini 3'e bol, sonucu yuvarla
    const startingCell = zemin[startingRow][startingCol];
    return {
        row: startingRow,
        col: startingCol,
        cell: startingCell,
    };
};



const Board = () => {
    const [skor, skorAyarla] = useState(0);
    const [zemin, zeminAyarla] = useState(zeminOlustur(ZEMIN_BOYUT));
    const [yilan, yilanAyarla] = useState(
        new LinkedList(yilanBaslangicNoktasiGetir(zemin)),
    );
    const [yilanKutulari, yilanKutulariAyarla] = useState(
        new Set([yilan.head.value.cell]),
    );
    const [yemekKutusu, yemekKutusuAyarla] = useState(yilan.head.value.cell + 5);
    const [yon, yonAyarla] = useState(Direction.RIGHT);
    const [yemekTersYondeOlmali, yemekTersYondeOlmaliAyarla] = useState(
        false,
    );
    const [bonusMiktari, bonusMiktariAyarla] = useState(10);
    const [bonusUyarisi, bonusUyarisiniAyarla] = useState(
        false,
    );

    useEffect( () => {
        window.addEventListener('keydown', e => {
            handleKeydown(e);
        });
    }, []);

    useInterval( () => {
        yilaniOynat();
    }, 150);

    const handleKeydown = e => {
        const yeniYon = tustanYonuAl(e.key);
        const gecerliBirYonMu = yeniYon !== '';
        if (!gecerliBirYonMu) return;
        const yilanKendiUzerineCikti =
            zitYonuGetir(yeniYon) === yon && yilanKutulari.size > 1;
        if (yilanKendiUzerineCikti) return;
        yonAyarla(yeniYon)
    }

    const yilaniOynat = () => {
        const suankiKafaKordinatlari = {
            row: yilan.head.value.row,
            col: yilan.head.value.col,
        };

        const birSonrakiKafaKordinatlari = yondekiKordinatlariGetir(suankiKafaKordinatlari, yon);
        if (sinirDisindaMi(birSonrakiKafaKordinatlari, zemin)) {
            oyunuSonlandir();
            return;
        }

        const birSonrakiKafaKutusu = zemin[birSonrakiKafaKordinatlari.row][birSonrakiKafaKordinatlari.col];
        if (yilanKutulari.has(birSonrakiKafaKutusu)) {
            oyunuSonlandir();
            return;
        }

        const yeniKafa = new LinkedListNode({
            row: birSonrakiKafaKordinatlari.row,
            col: birSonrakiKafaKordinatlari.col,
            cell: birSonrakiKafaKutusu
        })

        const suankiKafa = yilan.head;
        yilan.head = yeniKafa;
        suankiKafa.next = yeniKafa;

        const yeniYilanKutulari = new Set(yilanKutulari);
        yeniYilanKutulari.delete(yilan.tail.value.cell);
        yeniYilanKutulari.add(birSonrakiKafaKutusu);

        yilan.tail = yilan.tail.next;
        if (yilan.tail === null) yilan.tail = yilan.head;

        const yemekTuketildi = birSonrakiKafaKutusu === yemekKutusu;
        if (yemekTuketildi) {
            yilaniBuyut(yeniYilanKutulari);
            if (yemekTersYondeOlmali) {
                yemekTuket(yeniYilanKutulari, true);
            } else {
                yemekTuket(yeniYilanKutulari, false);
            }
        }

        yilanKutulariAyarla(yeniYilanKutulari);
    }



    const yilaniBuyut = yeniYilanKutulari => {
        const buyutulecekNodeKordinatlari = buyutulecekNodeKordinatlariniGetir(yilan.tail, yon);
        if (sinirDisindaMi(buyutulecekNodeKordinatlari, zemin))
        {
            // daha buyuyecek yer kalmadi demek oluyor.
            return;
        }
        const yeniKuyrukKutusu = zemin[buyutulecekNodeKordinatlari.row][buyutulecekNodeKordinatlari.col];
        const yeniKuyruk = new LinkedListNode({
            row: buyutulecekNodeKordinatlari.row,
            col: buyutulecekNodeKordinatlari.col,
            cell: yeniKuyrukKutusu,
        });
        const suankiKuyruk = yilan.tail;
        yilan.tail = yeniKuyruk;
        yilan.tail.next = suankiKuyruk;

        yeniYilanKutulari.add(yeniKuyrukKutusu);
    }

    const buyutulecekNodeKordinatlariniGetir = (yilanKuyruk, suankiYon) => {
        const kuyrukBirSonrakiNodeYonu = birSonrakiNodeYonunuGetir(
            yilanKuyruk,
            suankiYon,
        );
        const buyumeYonu = zitYonuGetir(kuyrukBirSonrakiNodeYonu);
        const suankiKuyrukKordinatlari = {
            row: yilanKuyruk.value.row,
            col: yilanKuyruk.value.col,
        };
        const buyuyecekNodeKordinatlari = yondekiKordinatlariGetir(
            suankiKuyrukKordinatlari,
            buyumeYonu,
        );
        return buyuyecekNodeKordinatlari;
    }

    





    const yemekTuket = (yeniYilanKutulari, bonus) => {
        const maksOlasiKutuValue = ZEMIN_BOYUT * ZEMIN_BOYUT;

        let birSonrakiYemekKutusu;

        while (true) {
            birSonrakiYemekKutusu = randomIntFromInterval(1, maksOlasiKutuValue);
            if (yeniYilanKutulari.has(birSonrakiYemekKutusu) || yemekKutusu === birSonrakiYemekKutusu) {
                continue;
            } else {
                break;
            }

        }

        const birSonrakiYemekTersYondeOlmali = 
            Math.random() < PROBABILITY_OF_DIRECTION_REVERSAL_FOOD;

        yemekKutusuAyarla(birSonrakiYemekKutusu);
        yemekTersYondeOlmaliAyarla(birSonrakiYemekTersYondeOlmali);
        if (bonus) {
            skorAyarla(skor + bonusMiktari);
            bonusUyarisiniAyarla(true);
            setTimeout(() => {
                bonusUyarisiniAyarla(false);
            }, 2000);
        }
        else
        {

            skorAyarla(skor + 1);
        }
    }

    const birSonrakiNodeYonunuGetir = (node, suankiYon) => {
        if (node.next === null) return suankiYon;

        const {row: currentRow, col: currentCol} = node.value;
        const {row: nextRow, col: nextCol} = node.next.value;
        if (nextRow === currentRow && nextCol === currentCol + 1) {
          return Direction.RIGHT;
        }
        if (nextRow === currentRow && nextCol === currentCol - 1) {
          return Direction.LEFT;
        }
        if (nextCol === currentCol && nextRow === currentRow + 1) {
          return Direction.DOWN;
        }
        if (nextCol === currentCol && nextRow === currentRow - 1) {
          return Direction.UP;
        }
        return '';

        

    };


    const tustanYonuAl = key => {
        const keyLC = key.toLowerCase();
        if (keyLC === 'arrowup' || keyLC === 'w') {
            return Direction.UP;
        } else if (keyLC === 'arrowright' || keyLC === 'd') {
            return Direction.RIGHT;
        } else if (keyLC === 'arrowdown' || keyLC === 's') {
            return Direction.DOWN;
        } else if (keyLC === 'arrowleft' || keyLC === 'a') {
            return Direction.LEFT;
        } else {
            return '';
        }
    }

    
    const zitYonuGetir = key => {
        const keyLC = key.toLowerCase();
        if (keyLC === 'arrowup' || keyLC === 'w') {
            return Direction.DOWN;
        } else if (keyLC === 'arrowright' || keyLC === 'd') {
            return Direction.LEFT;
        } else if (keyLC === 'arrowdown' || keyLC === 's') {
            return Direction.UP;
        } else if (keyLC === 'arrowleft' || keyLC === 'a') {
            return Direction.RIGHT;
        } else {
            return '';
        }
    }

    const yondekiKordinatlariGetir = (kordinatlar, yon) => {
        let geciciRow = kordinatlar.row;
        let geciciCol = kordinatlar.col;
        if (yon === Direction.UP) {
            geciciRow -= 1;
        }
        else if (yon === Direction.RIGHT) {
            geciciCol += 1;
        }
        else if (yon === Direction.DOWN) {
            geciciRow += 1;
        }
        else if (yon === Direction.LEFT) {
            geciciCol -= 1;
        }
        return {
            row: geciciRow,
            col: geciciCol,
        };
    }

    

    const oyunuSonlandir = () => {
        skorAyarla(0)
        const yilanBaslangicNoktasi = yilanBaslangicNoktasiGetir(zemin);
        yilanAyarla(new LinkedList(yilanBaslangicNoktasi));
        yemekKutusuAyarla(yilanBaslangicNoktasi.cell + 5);
        yilanKutulariAyarla(new Set([yilanBaslangicNoktasi.cell]));
        yonAyarla(Direction.RIGHT);
    }


    return (
    <>
        <h1>Skor: {skor}</h1>
        
            <div class="bonus-msg">
                {bonusUyarisi && (
                    <p>{bonusMiktari} Miktarında Bonus Kazandın!</p>
                )}
            </div>
        
        
        <div className="board">
        {zemin.map((row, rowIdx) => (
            <div key={rowIdx} className="row">
            {row.map((cellValue, cellIdx) => {
                const className = classAdiGetir(
                cellValue,
                yemekKutusu,
                yemekTersYondeOlmali,
                yilanKutulari,
                );
                return <div key={cellIdx} className={className}></div>;
            })}
            </div>
        ))}
        </div>
    </>
    );

}

const zeminOlustur = ZEMIN_BOYUT => {
    let sayac = 1;
    const zemin = [];

    for (let row = 0; row < ZEMIN_BOYUT; row++) {
        const suankiRow = [];
        for (let col = 0; col < ZEMIN_BOYUT; col++) {
            suankiRow.push(sayac++);
        }
        zemin.push(suankiRow);
    }
    return zemin;
}

const sinirDisindaMi = (kordinatlar, zemin) => {
    const {row, col} = kordinatlar;
    if (row < 0 || col < 0) return true;
    if (row >= zemin.length || col >= zemin[0].length) return true;
    return false;
}

const classAdiGetir = (
    cellValue,
    foodCell,
    foodShouldReverseDirection,
    snakeCells,
) => {
    let className = 'cell';
    if (cellValue === foodCell) {
        if (foodShouldReverseDirection) {
        className = 'cell cell-purple';
        } else {
        className = 'cell cell-green';
        }
    }
    if (snakeCells.has(cellValue)) className = 'cell cell-snake';

    return className;
};





export default Board;