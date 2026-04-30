class FareService {

  getFare(n) {
    if (n === 0) return 10;
    if (n <= 2) return 10;
    if (n <= 4) return 20;
    if (n <= 6) return 30;
    if (n <= 8) return 40;
    if (n <= 10) return 50;
    if (n <= 14) return 60;
    if (n <= 18) return 70;
    if (n <= 26) return 80;
    return 90;
  }

  isNonPeak(d) {
    let h = d.getHours();
    return (h < 8 || (h >= 12 && h < 16) || h >= 21);
  }

  isHoliday(d) {
    let f = d.toISOString().slice(5,10);
    return ["01-26","08-15","10-02"].includes(f);
  }

  applyDiscount(fare, d, card) {
    if (card === "token") return fare;
    if (this.isHoliday(d) || d.getDay() === 0) return fare * 0.9;
    if (this.isNonPeak(d)) return fare * 0.9;
    return fare * 0.95;
  }
}