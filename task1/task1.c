/*
 * Задание 1, вариант 1.
 *
 * Даны 2 числа X1 и X2. Перевести каждое из них в двоичную систему
 * счисления. Выполнить сложение и умножение полученных двоичных чисел.
 * Результаты представить в шестнадцатеричной системе счисления.
 * Проверить полученные результаты.
 *
 * Числа хранятся в формате с фиксированной точкой: целое без знака,
 * младшие frac_bits разрядов которого - дробная часть.
 *
 * Сборка:  gcc -Wall -o task1 task1.c
 * Запуск:  ./task1
 */

#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <math.h>

#ifdef _WIN32
#include <windows.h>
#endif

#define X1 4.8125
#define X2 8.125

/* разрядов дробной части у исходных чисел */
#define FRAC_BITS 8

typedef uint64_t fixed_t;

/* Перевод десятичного числа в двоичное с выводом хода перевода.
 * Целая часть - последовательным делением на 2,
 * дробная часть - последовательным умножением на 2. */
static fixed_t to_binary(double x, int frac_bits)
{
    uint64_t ip = (uint64_t)x;
    double fp = x - (double)ip;
    fixed_t result = 0;
    int i;

    printf("  Целая часть %llu (деление на 2, остатки читаются снизу вверх):\n",
           (unsigned long long)ip);
    if (ip == 0)
        printf("    0\n");
    for (uint64_t n = ip; n > 0; n /= 2)
        printf("    %llu / 2 = %llu, остаток %llu\n",
               (unsigned long long)n, (unsigned long long)(n / 2),
               (unsigned long long)(n % 2));

    printf("  Дробная часть %g (умножение на 2, целые части читаются сверху вниз):\n", fp);
    for (i = 0; i < frac_bits && fp > 0.0; i++) {
        double before = fp;
        int bit;

        fp *= 2.0;
        bit = (int)fp;
        fp -= bit;
        printf("    %g * 2 = %g -> %d\n", before, before * 2.0, bit);
        result |= (fixed_t)bit << (frac_bits - 1 - i);
    }
    if (fp > 0.0)
        printf("    (перевод прерван после %d разрядов, есть погрешность)\n", frac_bits);

    result |= (fixed_t)ip << frac_bits;
    return result;
}

/* Строка с двоичной записью числа (незначащие нули отброшены). */
static void bin_str(fixed_t v, int frac_bits, char *buf)
{
    uint64_t ip = v >> frac_bits;
    int len = 0, i, start = 63;

    while (start > 0 && !((ip >> start) & 1))
        start--;
    for (i = start; i >= 0; i--)
        buf[len++] = (char)('0' + ((ip >> i) & 1));

    buf[len++] = '.';
    for (i = frac_bits - 1; i >= 0; i--)
        buf[len++] = (char)('0' + ((v >> i) & 1));
    /* убираем незначащие нули в конце дробной части */
    while (buf[len - 1] == '0' && buf[len - 2] != '.')
        len--;
    buf[len] = '\0';
}

/* Строка с шестнадцатеричной записью числа: двоичные разряды
 * разбиваются на тетрады влево и вправо от точки. */
static void hex_str(fixed_t v, int frac_bits, char *buf)
{
    static const char digits[] = "0123456789ABCDEF";
    uint64_t ip = v >> frac_bits;
    int pad = (4 - frac_bits % 4) % 4;
    int nibbles = (frac_bits + pad) / 4;
    uint64_t fp = (v & (((fixed_t)1 << frac_bits) - 1)) << pad;
    int len, i;

    len = sprintf(buf, "%llX.", (unsigned long long)ip);
    for (i = nibbles - 1; i >= 0; i--)
        buf[len++] = digits[(fp >> (4 * i)) & 0xF];
    while (buf[len - 1] == '0' && buf[len - 2] != '.')
        len--;
    buf[len] = '\0';
}

/* Перевод шестнадцатеричной строки обратно в десятичное число (для проверки). */
static double hex_to_double(const char *s)
{
    double result = 0.0, weight = 1.0 / 16.0;
    const char *p;

    for (p = s; *p && *p != '.'; p++)
        result = result * 16.0 + (double)(strchr("0123456789ABCDEF", *p) - "0123456789ABCDEF");
    if (*p == '.')
        for (p++; *p; p++, weight /= 16.0)
            result += weight * (double)(strchr("0123456789ABCDEF", *p) - "0123456789ABCDEF");
    return result;
}

/* Двоичное сложение: поразрядно, с переносом (полный сумматор). */
static fixed_t bin_add(fixed_t a, fixed_t b)
{
    fixed_t result = 0;
    unsigned carry = 0;
    int i;

    for (i = 0; i < 64; i++) {
        unsigned ai = (unsigned)((a >> i) & 1);
        unsigned bi = (unsigned)((b >> i) & 1);
        unsigned s = ai ^ bi ^ carry;

        carry = (ai & bi) | (ai & carry) | (bi & carry);
        result |= (fixed_t)s << i;
    }
    return result;
}

/* Строка с двоичной записью целого числа. */
static void int_bin_str(uint64_t v, char *buf)
{
    int start = 63, len = 0, i;

    while (start > 0 && !((v >> start) & 1))
        start--;
    for (i = start; i >= 0; i--)
        buf[len++] = (char)('0' + ((v >> i) & 1));
    buf[len] = '\0';
}

/* Отбрасывает незначащие нули в конце дробной части,
 * возвращает оставшееся число дробных разрядов. */
static int trim_frac(fixed_t *v, int frac_bits)
{
    while (frac_bits > 0 && !(*v & 1)) {
        *v >>= 1;
        frac_bits--;
    }
    return frac_bits;
}

/* Двоичное умножение "столбиком": точка временно не учитывается,
 * для каждой единицы множителя к результату прибавляется множимое,
 * сдвинутое на номер разряда. Затем в произведении отделяется
 * столько дробных разрядов, сколько их у обоих сомножителей вместе.
 * Возвращает произведение с 2 * frac_bits дробными разрядами. */
static fixed_t bin_mul(fixed_t a, fixed_t b, int frac_bits)
{
    fixed_t result = 0;
    int fa = trim_frac(&a, frac_bits);
    int fb = trim_frac(&b, frac_bits);
    char buf[80];
    const int w = 24;
    int i;

    printf("  Без учёта точки (у X1 дробных разрядов %d, у X2 - %d):\n", fa, fb);
    int_bin_str(a, buf);
    printf("    %*s\n", w, buf);
    int_bin_str(b, buf);
    printf("  * %*s\n", w, buf);
    printf("    %.*s\n", w, "------------------------------------------");
    for (i = 0; i < 64; i++) {
        if ((b >> i) & 1) {
            int_bin_str(a, buf);
            printf("  + %*s\n", w - i, buf);
            result = bin_add(result, a << i);
        }
    }
    printf("    %.*s\n", w, "------------------------------------------");
    int_bin_str(result, buf);
    printf("    %*s\n", w, buf);
    printf("  Отделяем точкой %d + %d = %d дробных разрядов.\n", fa, fb, fa + fb);

    return result << (2 * frac_bits - fa - fb);
}

int main(void)
{
    const double x1 = X1, x2 = X2;
    fixed_t b1, b2, sum, prod;
    char s1[160], s2[160], ssum[160], sprod[160], hsum[80], hprod[80];
    double vsum, vprod;
    int ok_sum, ok_prod;

#ifdef _WIN32
    SetConsoleOutputCP(CP_UTF8);
#endif

    printf("Вариант 1: X1 = %g, X2 = %g\n\n", x1, x2);

    printf("1. Перевод X1 = %g в двоичную систему\n", x1);
    b1 = to_binary(x1, FRAC_BITS);
    bin_str(b1, FRAC_BITS, s1);
    printf("  X1 = %g(10) = %s(2)\n\n", x1, s1);

    printf("2. Перевод X2 = %g в двоичную систему\n", x2);
    b2 = to_binary(x2, FRAC_BITS);
    bin_str(b2, FRAC_BITS, s2);
    printf("  X2 = %g(10) = %s(2)\n\n", x2, s2);

    printf("3. Сложение\n");
    sum = bin_add(b1, b2);
    bin_str(sum, FRAC_BITS, ssum);
    hex_str(sum, FRAC_BITS, hsum);
    printf("    %24s\n  + %24s\n    %24s\n  = %24s(2)\n", s1, s2,
           "------------------------", ssum);
    printf("  X1 + X2 = %s(2) = %s(16)\n\n", ssum, hsum);

    printf("4. Умножение\n");
    prod = bin_mul(b1, b2, FRAC_BITS);
    bin_str(prod, 2 * FRAC_BITS, sprod);
    hex_str(prod, 2 * FRAC_BITS, hprod);
    printf("  X1 * X2 = %s(2) = %s(16)\n\n", sprod, hprod);

    printf("5. Проверка (перевод результатов из 16-й системы в 10-ю)\n");
    vsum = hex_to_double(hsum);
    vprod = hex_to_double(hprod);
    ok_sum = fabs(vsum - (x1 + x2)) < 1e-9;
    ok_prod = fabs(vprod - x1 * x2) < 1e-9;
    printf("  %s(16) = %.10g(10);  X1 + X2 = %g + %g = %.10g  -> %s\n",
           hsum, vsum, x1, x2, x1 + x2, ok_sum ? "верно" : "ОШИБКА");
    printf("  %s(16) = %.10g(10);  X1 * X2 = %g * %g = %.10g  -> %s\n",
           hprod, vprod, x1, x2, x1 * x2, ok_prod ? "верно" : "ОШИБКА");

    return (ok_sum && ok_prod) ? 0 : 1;
}
