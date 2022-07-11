pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom";// hint: you can use more than one templates in circomlib-matrix to help you

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution
    
    var isValid = 1; // save outcome

    // [bonus] insert your code here
    // matrix multiplication
    component matM = matMul(n, n, 1);

    for (var i = 0; i < n; i++) {
        matM.b[i][0] <== x[i];

        for (var j = 0; j < n; j++) {
            matM.a[i][j] <== A[i][j];
        }
    }

    // comparison
    component isEqualArr[n];

    for (var i = 0; i < n; i++) {
        isEqualArr[i] = IsEqual();
        isEqualArr[i].in[0] <== b[i];
        isEqualArr[i].in[1] <== matM.out[i][0];

        isValid *= isEqualArr[i].out == 1 ? 1 : 0;
    }

    out <-- isValid;
}

component main {public [A, b]} = SystemOfEquations(3);