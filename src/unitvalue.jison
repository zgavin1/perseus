/* Parse unit-tagged values. Examples:
 * - 5.3x10^5 kg m / s^2
 * - 5 mmHg
 * - (3 * 10) (kg m) / s^2
 */

%lex

/*
00b5 - micro
212b - angstrom
00b0 - degree
2103 - degree celcius
2109 - degree fahrenheit
*/

%%
\s+                        /* skip whitespace */
"*"                        return 'MUL';
x\b                        return 'MUL';
"\u00d7"                   return 'MUL';
"\u2a2f"                   return 'MUL';
"\u22c5"                   return 'MUL';
[0-9]+\b                   return 'NAT';
[0-9]+("."[0-9]+)?\b       return 'FLOAT';
[A-Za-z]+                  return 'ATOM';
[\u00b5\u212b\u2103\u2109] return 'ATOM';
("\00b0 "|"\00bo")[cCfF]   return 'ATOM';
"/"                        return '/';
"("                        return '(';
")"                        return ')';
"^"                        return '^';
"10^"                      return 'POW';
"10 ^"                     return 'POW';
<<EOF>>                    return 'EOF';

/lex

%start unitvalue

%%

unitvalue
    : magnitude unit EOF
        %{
            return {
                magnitude: $1,
                unit: $2,
            };
        }%
    ;

magnitude
    : float MUL POW nat
        %{ /* XXX keep track of the exact thing the user entered? */
            $$ = $1 * 10^$4;
        }%
    | float
        { $$ = $1; }
    ;

unit
    : multatoms DIV multatoms
        %{
            $$ = {
                num: $1,
                denom: $3,
            };
        }%
    | multatoms
        %{
            $$ = {
                num: $1,
                denom: null,
            };
        }%
    ;

multatoms
    : expatom MUL multatoms
        { $$ = [$1].concat($3); }
    | expatom
        { $$ = [$1]; }
    ;

expatom
    : atom '^' nat
        %{
            $$ = {
                name: $1,
                pow: $3,
            };
        }%
    | atom
        %{
            $$ = {
                name: $1,
                pow: 1,
            };
        }%
    ;

atom
    : ATOM
    { $$ = yytext; }
    ;

float
    : FLOAT
        { $$ = +$1; }
    | nat
        { $$ = $1; }
    ;

nat : NAT
        { $$ = +$1; }
    ;
